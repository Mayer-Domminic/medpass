import random
import google.generativeai as genai
from app.core.config import settings

# Parse multiple API keys from environment/settings
API_KEYS = [key.strip() for key in settings.GEMINI_API_KEYS.split(",") if key.strip()]
if not API_KEYS:
    raise ValueError("No GEMINI_API_KEYS configured in settings")

# Embedding model name
MODEL_NAME = "gemini-embedding-exp-03-07"


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
    genai.configure(api_key=api_key)  # ([github.com](https://github.com/google-gemini/generative-ai-python/blob/main/docs/api/google/generativeai.md), [github.com](https://github.com/google-gemini/generative-ai-python/blob/main/docs/api/google/generativeai.md?utm_source=chatgpt.com))
    result = genai.embed_content(
        model=MODEL_NAME,
        content=text
    )
    # Single vs batch response handling
    return result.get("embedding") or result.get("embeddings")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts (up to 250 items).
    """
    api_key = _select_api_key()
    genai.configure(api_key=api_key)
    result = genai.embed_content(
        model=MODEL_NAME,
        content=texts
    )
    return result.get("embeddings")
