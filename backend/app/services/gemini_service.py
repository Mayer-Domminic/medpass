import random
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings

from app.models import ChatConversation, ChatMessage

# Parse multiple API keys from environment/settings
API_KEYS = [key.strip() for key in settings.GEMINI_API_KEYS.split(",") if key.strip()]
if not API_KEYS:
    raise ValueError("No GEMINI_API_KEYS configured in settings")

# Embedding model name
EMBED_MODEL = "gemini-embedding-exp-03-07"
FLASH_MODEL = "gemini-2.5-flash-preview-04-17"


def _select_api_key() -> str:
    """
    Randomly select an API key to distribute calls.
    """
    return random.choice(API_KEYS)


def embed_text(text: str) -> list[float]:
    """
    Generate an embedding for a single text snippet.
    """
    api_key = _select_api_key()
    genai.configure(api_key=api_key)
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=text
    )
    return result.get("embedding") or result.get("embeddings")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts.
    """
    api_key = _select_api_key()
    genai.configure(api_key=api_key)
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=texts
    )
    return result.get("embeddings")


def chat_flash(
    messages: list[dict[str, str]],
    model: str = FLASH_MODEL
) -> dict[str, any]:
    """
    Send a list of messages to the Gemini flash model and return the assistant response and usage.
    messages: [{"author": "user"|"assistant", "content": str}, ...]
    """
    api_key = _select_api_key()
    genai.configure(api_key=api_key)
    response = genai.chat.completions.create(
        model=model,
        messages=messages
    )
    candidate = response.choices[0].message
    return {"content": candidate.content, "usage": getattr(response, 'usage', {})}


def start_and_store_conversation(
    user_id: int,
    title: str,
    initial_message: str,
    db: Session | None = None
) -> "ChatConversation":
    """
    Create a new conversation record and store the initial user message.
    """
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    from app.models import ChatConversation, ChatMessage
    convo = ChatConversation(userid=user_id, title=title, isactive=True)
    db.add(convo)
    db.flush()
    msg = ChatMessage(conversationid=convo.conversationid, sendertype="user", content=initial_message)
    db.add(msg)
    db.commit()
    return convo


def append_and_store_message(
    conversation_id: int,
    sender: str,
    content: str,
    db: Session | None = None
) -> "ChatMessage":
    """
    Append a message to an existing conversation and persist it.
    """
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    from app.models import ChatMessage
    msg = ChatMessage(conversationid=conversation_id, sendertype=sender, content=content)
    db.add(msg)
    db.commit()
    return msg


def get_chat_history(
    conversation_id: int,
    db: Session | None = None
) -> list[dict[str, any]]:
    """
    Retrieve all messages for a conversation, ordered by timestamp.
    Returns list of {sender, content, timestamp}.
    """
    if db is None:
        from app.core.database import get_db
        db = next(get_db())
    from app.models import ChatMessage
    records = (
        db.query(ChatMessage)
          .filter(ChatMessage.conversationid == conversation_id)
          .order_by(ChatMessage.timestamp)
          .all()
    )
    history = []
    for m in records:
        history.append({
            "sender": m.sendertype,
            "content": m.content,
            "timestamp": m.timestamp
        })
    return history
