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
import json
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


def chat_model(
    messages: List[dict],
    model: str = "gemini-2.5-flash-preview-04-17",
    use_chat_context: bool = True,
    use_rag_doucments: bool = True,
    rag_query: Optional[str] = None,
    conversation_id: Optional[int] = None,
    context_limit: int = 5,
):
    genai.configure(api_key=_select_api_key())
    
    chat_contexts = []
    rag_content = []
    
    if use_chat_context and conversation_id:
        chat_contexts = get_recent_chat_context(conversation_id, context_limit)
    if use_rag_doucments and rag_query:
        from app.services.rag_service import search_documents
        rag_content = search_documents(rag_query, context_limit)
        
    system_prompt = construct_system_prompt(chat_contexts, rag_content)
    #print("here is system context")
    #print(system_prompt)
    full_messages = []
    
    if system_prompt.strip():
        full_messages.append({
            "role": "user", 
            "parts": [{"text": system_prompt}]
        })
    
    for msg in messages:
        full_messages.append({
            "role": msg["role"],
            "parts": [{"text": msg["content"]}]
        })
    
    model_obj = genai.GenerativeModel(model)
    chat_session = model_obj.start_chat(history=full_messages)
    response = chat_session.send_message(content=messages[-1]["content"])

    return response.candidates[0].content.parts[0].text


def construct_system_prompt(chat_context: List[dict[str, str]], rag_documents: List[dict[str, str]]):
    
    prompt_parts = []
    
    if chat_context:
        prompt_parts.append("Previous Chat Context:")
        for context in chat_context:
            prompt_parts.append(f"{context['title']}: {context['content']}")
    
    if rag_documents:
        prompt_parts.append("Relevant Documents:")
        for doc in rag_documents:
            prompt_parts.append(f"{doc['title']}: {doc['content']}")
            
    final_prompt = "\n".join(prompt_parts)
    
    return final_prompt

# Above are old functions keeping them for now

# Parameters for Min Chat Length and Embedding 
MIN_CHAT_LENGTH = 5
# Minimum Embedding Length is important, we don't want to embedded "ok" or "yes"
MIN_EMBEDDING_LENGTH = 50

# Cost Functions, simple but will be constantly used
# This isn't needed if we are able to retrive the cost from the API call itself

def calculate_token_usage(text: str):
    
    # From research gemeni uses 1 token per 4 characters
    return len(text) // 4

def calculate_message_cost(tokens_input, tokens_output):
    
    # Change cost to the actual cost of final model
    # Is currently using 2.5 flash token cost 
    return (tokens_input * 0.00000015) + (tokens_output * 0.0000035)

def generate_title(content):
    
    # If the content is less than 30 already just reutrn it as the title
    if len(content) <= 50:
        return content
    
    # If the user is nice enough to leave a period
    period_position = content.find(".")
    if 0 < period_position < 50:
        return content[:period_position + 1].strip()
    
    # No period just use the space before a word gets cut off
    last_space = content.rfind(" ", 0, 50)
    if last_space > 0:  
        return content[:last_space].strip() + "..."
    
    # Case just in case someone tries to blow up the system and have no spaces. 
    
    return content[:50].strip() + "..."


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

def create_conversation(
    db, 
    user_id,
    content,
    sender_type, 
    title: Optional[str] = None, 
    metadata: Optional[Dict[str, Any]] = None,
    auto_process_context: bool = True
    ):
    
    if title is not None:
        conversation_title = title
    else:
        conversation_title = generate_title(content)
        
    conversation = ChatConversation(
        userid=user_id,
        title=conversation_title,
        createdat=datetime.utcnow(),
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    conversation_id = conversation.conversationid
    
    message = create_message(db, conversation_id, content, sender_type, metadata)
    
    '''
    if auto_process_context:
        embed_and_create_context_messages(db, message.messageid)
    Ignore for now
    '''
    return message, conversation

def generate_model_response(
    db: Session,
    user_message_id: int,
    use_rag: bool = True,
    rag_query: Optional[str] = None,
    model: str = "gemini-2.5-flash-preview-04-17"
):
    
    user_message = db.query(ChatMessage).filter(ChatMessage.messageid == user_message_id).first()
    
    if not user_message:
        raise ValueError("Message nto found")
    
    conversation_id = user_message.conversationid
    
    model_response = chat_model(
        messages = [{"role": "user", "content": user_message.content}],
        use_chat_context = True,
        use_rag_doucments = use_rag,
        rag_query = rag_query or user_message.content,
        conversation_id=conversation_id,
        model=model
    )
    
    
    model_message = create_message(
        db = db,
        conversation_id = conversation_id,
        content = model_response,
        sender_type = "flash",
        metadata=None
    )
    
    return model_message
        
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

    embed_and_create_context_messages(db, new_message.messageid)
    
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

def embed_and_create_context_messages(db, message_id):
    from app.models.chat_models import ChatMessage
    from app.services.rag_service import generate_chat_message_embedding

    message = db.query(ChatMessage).filter(ChatMessage.messageid == message_id).first()
    
    if not message:
        return  # Optionally raise error or log
    
    if len(message.content) >= MIN_EMBEDDING_LENGTH:
        generate_chat_message_embedding(db, message_id)

# Function to check to create big context summaries (i.e greater than 5 messages)
def check_create_context_summary(db, conversation_id):
    count = db.query(ChatMessage).filter(ChatMessage.conversationid == conversation_id).count()
    return count % MIN_CHAT_LENGTH == 0

def create_context_from_recent_message(db, conversation_id, user_id):
    # Gets the last x (min chat length) messages to create a context
    messages = db.query(ChatMessage).filter(ChatMessage.conversationid == conversation_id).order_by(ChatMessage.timestamp).limit(MIN_CHAT_LENGTH).all()
    if not messages:
        return None
    
    user_id = db.query(ChatMessage).filter(ChatMessage.conversationid == conversation_id).first().userid
    
    content_summary = "\n".join(
        [f"{msg.sendertype}: {msg.content}" for msg in messages]
    )
    title = generate_title((messages[0].content))    
    context = ChatContext(
        conversationid=conversation_id,
        title=title,
        content=content_summary,
        createdat=datetime.utcnow(),
        updatedat=datetime.utcnow(),
        isactive=True,  
        createdby=user_id,  
    )
    db.add(context)
    db.commit()
    db.refresh(context)
    
    for msg in messages:
        link_context_to_message(db, msg.messageid, context.contextid)
    
    from app.services.rag_service import generate_chat_context_embedding, generate_chat_message_embedding
    generate_chat_context_embedding(db, context.contextid)
    
    return context
        
def link_context_to_message(db, message_id, context_id):
    context_link = ChatMessageContext(messageid=message_id, contextid=context_id, wasused=True)
    db.add(context_link) 
    db.commit() 
    
def get_recent_chat_context(conversation_id, limit):
    db = next(get_db())
    
    try:
        context = db.query(ChatContext).filter(ChatContext.conversationid == conversation_id).order_by(desc(ChatContext.updatedat)).limit(limit).all()
        return [{"title": ctx.title, "content": ctx.content} for ctx in context]
    except Exception as e:
        print(f"Error retrieving recent chat context: {e}")
        return []
    finally:
        db.close()


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