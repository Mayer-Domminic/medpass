import random
import datetime
import google.generativeai as genai
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.chat_models import ChatConversation, ChatMessage

# ——————— API-key rotation ———————
API_KEYS = [k.strip() for k in settings.GEMINI_API_KEYS.split(",") if k.strip()]
if not API_KEYS:
    raise ValueError("No GEMINI_API_KEYS configured")

def _select_api_key() -> str:
    return random.choice(API_KEYS)

# ——————— Embeddings ———————
EMBED_MODEL = "gemini-embedding-exp-03-07"
def embed_text(text: str) -> List[float]:
    genai.configure(api_key=_select_api_key())
    res = genai.embed_content(model=EMBED_MODEL, content=text)
    return res.get("embedding") or res.get("embeddings")

def embed_texts(texts: List[str]) -> List[List[float]]:
    genai.configure(api_key=_select_api_key())
    res = genai.embed_content(model=EMBED_MODEL, content=texts)
    return res.get("embeddings")

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

def get_chat_history(
    conversation_id: int,
    db: Optional[Session] = None
) -> List[dict]:
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    rows = (
        db.query(ChatMessage)
          .filter(ChatMessage.conversationid == conversation_id)
          .order_by(ChatMessage.timestamp)
          .all()
    )
    return [
        {
            "sender": m.sendertype,
            "content": m.content,
            "timestamp": m.timestamp.isoformat()
        }
        for m in rows
    ]
