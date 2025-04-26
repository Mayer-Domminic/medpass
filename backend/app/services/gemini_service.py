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

# ——————— Persistence helpers ———————
def start_and_store_conversation(
    user_id: int,
    initial_prompt: str,
    db: Optional[Session] = None
) -> int:
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    convo = ChatConversation(
        userid=user_id,
        title="Gemini Chat",
        isactive=True
    )
    db.add(convo); db.commit(); db.refresh(convo)
    append_and_store_message(convo.conversationid, "user", initial_prompt, db)
    return convo.conversationid

def append_and_store_message(
    conversation_id: int,
    sender: str,
    content: str,
    db: Optional[Session] = None
) -> ChatMessage:
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    msg = ChatMessage(
        conversationid=conversation_id,
        sendertype=sender,
        content=content,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return msg

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

def get_entire_chat(db, conversation_id):

    conversation = db.query(ChatConversation).filter(ChatConversation.conversationid == conversation_id).first()
    
    if not conversation:
        return None
    
    messages = db.query(ChatMessage).filter(ChatMessage.conversationid == conversation_id).order_by(ChatMessage.timestamp).all()
    
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