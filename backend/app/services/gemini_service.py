import random
import datetime
import re
import json
import google.generativeai as genai
from google.ai.generativelanguage_v1beta import GenerativeServiceClient
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, select, desc
from app.core.config import settings
from app.core.database import get_db
from app.models.chat_models import ChatConversation, ChatMessage, ChatContext, ChatMessageContext
from app.schemas.chat_schemas import ChatContextModel, ChatMessageWithContextModel, ChatConversationSummary, ChatConversationDetail
from datetime import datetime

# ——————— API-key rotation ———————
API_KEYS = [k.strip() for k in settings.GEMINI_API_KEYS.split(",") if k.strip()]
if not API_KEYS:
    raise ValueError("No GEMINI_API_KEYS configured")

def _select_api_key() -> str:
    index = random.randint(0, 3)

    return API_KEYS[index]

# ——————— Embeddings ———————
EMBED_MODEL = "models/text-embedding-004"
def embed_text(text: str) -> List[float]:
    genai.configure(api_key=_select_api_key())
    res = genai.embed_content(model=EMBED_MODEL, content=text)
    return res.get("embedding") or res.get("embeddings")

def embed_texts(texts: List[str]) -> List[List[float]]:
    genai.configure(api_key=_select_api_key())
    embeddings = []
    
    for idx, text in enumerate(texts, start=1):  # start counting from 1
        print(f"Embedding {idx}/{len(texts)}")  # Show progress
        
        res = genai.embed_content(model=EMBED_MODEL, content=text)
        embedding = res.get("embedding") or res.get("embeddings")
        embeddings.append(embedding)
    
    return embeddings

# ——————— Flash chat ———————
def chat_flash(
    messages: List[dict],          # [{"role": "user", "content": "..."}]
    model: str = "models/gemini-2.5-flash-preview-04-17"
) -> str:

    api_key = _select_api_key()
    genai.configure(api_key=api_key)

    try:
        model_instance = genai.GenerativeModel(model_name=model)
        prompt_text = "\n".join(m["content"] for m in messages)
        response = model_instance.generate_content(prompt_text)

        if response and response.text:
             return response.text
        else:
             print(f"Warning: Received empty or unexpected response from Gemini API for prompt: {prompt_text[:100]}...")
             return "Failed to generate response."

    except Exception as e:
        print(f"Error during Gemini API call in chat_flash: {str(e)}")
        raise

# Above are old functions keeping them for now

# Cost Functions, simple but will be constantly used
# This isn't needed if we are able to retrive the cost from the API call itself

def calculate_token_usage(text: str):
    
    # From research gemeni uses 1 token per 4 characters
    return len(text) // 4

def calculate_message_cost(tokens_input, tokens_output):
    
    # Change cost to the actual cost of final model
    # Is currently using 2.5 flash token cost 
    return (tokens_input * 0.00000015) + (tokens_output * 0.0000035)
    

def get_chat_history(db, logininfoid, active_only: bool = True):
    
    query = (
        select(
            ChatConversation,
            func.count(ChatMessage.messageid).label("message_count"),
        ).outerjoin(
            ChatMessage,
            ChatConversation.conversationid == ChatMessage.conversationid,
        ).where(
            ChatConversation.userid == logininfoid
        ).group_by(
            ChatConversation.conversationid
        ).order_by(
            desc(ChatConversation.updatedat)
        )
    )
    
    if active_only:
        query = query.where(ChatConversation.isactive == True)
        
    results = db.execute(query).all()
    
    conversations = []
    
    for conv, msg_count in results:
        conversations.append(
            ChatConversationSummary(
                conversationid=conv.conversationid,
                title=conv.title,
                createdat=conv.createdat,
                updatedat=conv.updatedat,
                message_count=msg_count,
                total_tokens=conv.totaltokensinput + conv.totaltokensoutput,
                total_cost=float(conv.totalcost)
            )
        )
        
    return conversations

def get_message_contexts(db, message_id):
    
    query = (
        select(
            ChatContext
        ).join(
            ChatMessageContext, ChatMessageContext.contextid == ChatContext.contextid
        ).where(
            ChatMessageContext.messageid == message_id
        )
    )
    
    results = db.execute(query).scalars().all()
    
    return [
        ChatContextModel(
            contextid=context.contextid,
            title=context.title,
            content=context.content,
            importancescore=context.importancescore,
            metadata=context.chatmetadata
        )
        for context in results
    ]

def get_entire_chat(db, conversation_id, since_timestamp: Optional[datetime] = None):

    conversation = db.query(ChatConversation).filter(ChatConversation.conversationid == conversation_id).first()
    
    if not conversation:
        return None
    
    query = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversationid == conversation_id)
        .order_by(ChatMessage.timestamp)
    )
    
    if since_timestamp:
        query = query.filter(ChatMessage.timestamp > since_timestamp)
        
    messages = query.all()
    
    result = ChatConversationDetail(
        conversationid=conversation.conversationid,
        title=conversation.title,
        createdat=conversation.createdat,
        updatedat=conversation.updatedat,
        isactive=conversation.isactive,
        totaltokensinput=conversation.totaltokensinput,
        totaltokensoutput=conversation.totaltokensoutput,
        totalcost=float(conversation.totalcost),
        messages=[]
    )
    
    # adding messages to the result
    
    for msg in messages: 
        context = get_message_contexts(db, msg.messageid)
        
        message_model = ChatMessageWithContextModel(
            messageid=msg.messageid,
            sendertype=msg.sendertype,
            content=msg.content,
            timestamp=msg.timestamp,
            tokensinput=msg.tokensinput,
            tokensoutput=msg.tokensoutput,
            messagecost=float(msg.messagecost),
            metadata=msg.messagemetadata,
            contexts=context
        )
        
        result.messages.append(message_model)
        
    return result

def create_conversation(db, user_id, title, metadata: Optional[Dict[str, Any]] = None) -> ChatConversation:
    
    conversation = ChatConversation(
        userid=user_id,
        title=title,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

def create_message(db, conversation_id, content, sender_type, metadata: Optional[Dict[str, Any]] = None) -> ChatMessage:
    
    tokens = calculate_token_usage(content)
    
    new_message = ChatMessage(
        conversationid=conversation_id,
        sendertype=sender_type,
        content=content,
        # Allows us to differentiate the cost between user and flash
        tokensinput=tokens if sender_type == "user" else 0,
        tokensoutput=tokens if sender_type == "flash" else 0,
        messagecost=calculate_message_cost(
            tokens if sender_type == "user" else 0,
            tokens if sender_type == "flash" else 0
        ),
        messagemetadata=metadata
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    conversation = db.query(ChatConversation).filter(ChatConversation.conversationid == conversation_id).first()
    
    if conversation:
        if sender_type == "user":
            conversation.totaltokensinput += tokens
        else:
            conversation.totaltokensoutput += tokens
            
        conversation.totalcost += new_message.messagecost
        conversation.updatedat = datetime.utcnow()
        db.commit()
        
    return new_message

async def generate_domain_questions(domain: str, subdomain: str, student_id: int, count: int = 10, additional_context: str = ""):
    try:
        prompt = f"""Generate exactly {count} multiple-choice medical questions for the domain "{domain}" and subdomain "{subdomain}".

Each question must strictly follow these rules:
1. Be directly relevant to the subdomain topic.
2. Have exactly 4 possible answers (labeled A, B, C, D).
3. Have only one correct answer among the 4 options.
4. Include a brief explanation for why the correct answer is right.
5. Vary in difficulty (easy, medium, hard).
6. The entire response MUST be a single, COMPLETE and VALID JSON object.
7. The JSON object MUST have a single key: "questions".
8. The value associated with the "questions" key MUST be a JSON array containing EXACTLY {count} question objects.
9. Each element in the "questions" array MUST be a JSON object representing a question.
10. Each question object MUST have the following keys and value types:
    - "id": string (e.g., "1", "2", etc.)
    - "text": string (the question text)
    - "options": array of JSON objects. Each object in this array MUST have exactly these three keys:
        - "id": string (e.g., "A", "B", "C", "D")
        - "text": string (the option text)
        - "isCorrect": boolean (true if this is the correct answer, false otherwise)
        NOTE: The keys within each option object MUST be separated by commas.
    - "explanation": string (explanation for the correct answer)
    - "difficulty": string ("easy", "medium", or "hard")
    - "category": string (should be the subdomain name: "{subdomain}")

Ensure all strings within the JSON are properly escaped (e.g., double quotes inside strings are backslash-escaped).

{additional_context}

STRICTLY return ONLY the JSON object. DO NOT include any other text, formatting, or conversational elements before or after the JSON. The JSON must be the entire response and must be correctly formatted. Example format:
```json
{{
  "questions": [
    {{
      "id": "1",
      "text": "Question text here?",
      "options": [
        {{"id": "A", "text": "Option A", "isCorrect": false}},
        {{"id": "B", "text": "Option B", "isCorrect": true}},
        {{"id": "C", "text": "Option C", "isCorrect": false}},
        {{"id": "D", "text": "Option D", "isCorrect": false}}
      ],
      "explanation": "Explanation of correct answer",
      "difficulty": "medium",
      "category": "{subdomain}"
    }}
    // ... {count} total questions
  ]
}}
```
"""

        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        response_text = chat_flash(messages)

        print(f"Raw response from Gemini API: {response_text[:2000]}...") 

        # look for a JSON block first, then try  parsing
        json_match = re.search(r'```(?:json)?\s*({\s*"questions"[\s\S]*?})\s*```', response_text)
        
        if json_match:
            json_string = json_match.group(1)
            print("Found JSON code block, attempting to parse...")
            try:
                return json.loads(json_string)
            except json.JSONDecodeError as e:
                 print(f"JSON decode error from code block: {e}")
                 pass
        
        print("No JSON code block found or parsing failed, attempting direct parse...")
        try:
            start_index = response_text.find('{')
            end_index = response_text.rfind('}')
            
            if start_index != -1 and end_index != -1 and end_index > start_index:
                cleaned_response_text = response_text[start_index:end_index + 1]
                print(f"Attempting to parse cleaned text: {cleaned_response_text[:1000]}...")
            else:
                 print("Could not find valid JSON start/end markers in the response.")
                 print(f"Full raw response (no JSON markers): {response_text}")
                 raise ValueError("Could not find valid JSON structure in API response.")

            data = json.loads(cleaned_response_text)
            if isinstance(data, dict) and "questions" in data and isinstance(data["questions"], list):
                 print("Direct JSON parse successful and structure seems valid.")
                 return data
            else:
                 print("Direct JSON parse successful but structure is invalid.")
                 raise ValueError("Invalid JSON structure received from API")
        except json.JSONDecodeError as e:
            print(f"Direct JSON decode error: {e}")
            return {
                "error": f"Failed to generate valid JSON questions. JSON Decode Error: {e}",
                "questions": [],
                "raw_response": response_text[:1000]
            }
        except ValueError as e:
             print(f"Validation error after direct JSON parse: {e}")
             return {
                "error": f"Failed to generate valid questions. Validation Error: {e}",
                "questions": [],
                "raw_response": response_text[:1000]
            }


    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return {
            "error": f"Error generating questions: {str(e)}",
            "questions": []
        }