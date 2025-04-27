import random
import datetime
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
    model: str = "gemini-2.5-flash"
) -> str:
    genai.configure(api_key=_select_api_key())
    resp = genai.chat(model=model, messages=messages)
    return resp["candidates"][0]["content"]


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
    ) -> ChatConversation:
    
    if title is not None:
        conversation_title = title
    else:
        conversation_title = generate_title(content)
        
    conversation = ChatConversation(
        user_id=user_id,
        title=conversation_title,
        createdat=datetime.utcnow(),
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    conversation_id = conversation.conversationid
    
    message = create_message(db, conversation_id, content, sender_type, metadata)
    
    if auto_process_context:
        embed_and_create_context_messages(db, message)
    
    return message, conversation
        
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

def embed_and_create_context_messages(db, message):
    if len(message.content) >= MIN_EMBEDDING_LENGTH:
        from app.services.rag_service import generate_chat_message_embedding
        generate_chat_message_embedding(db, message)

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

