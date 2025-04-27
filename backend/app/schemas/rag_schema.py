from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class DocumentSearchResult(BaseModel):
    documentchunkid: int
    content: str
    title: str
    author: str
    similarity: float 
    
class DocumentSearchResponse(BaseModel):
    results: List[DocumentSearchResult]
    total_results: int
    