from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from app.core.database import (get_db,
    link_logininfo, 
    update_faculty_access
)

from app.services.gemini_service import embed_text
from app.services.rag_service import search_documents
from app.core.security import (
    get_current_active_user
)
from app.models import LoginInfo as User
from app.models import (
    Faculty,
    Student
)
from app.schemas.rag_schema import DocumentSearchResponse

import pandas as pd
from typing import Optional, List
from datetime import datetime

router = APIRouter()

@router.get("/search", response_model=DocumentSearchResponse)
async def search_documents_endpoint(
    query: str = Query(..., description="Search query text"),
    limit: int = Query(5, description="Maximum number of results to return", ge=1, le=100),
    faculty_id: Optional[int] = Query(None, description="Filter by faculty ID"),
    similarity_threshold: float = Query(0.5, description="Minimum similarity score (0-1)", ge=0, le=1),
    db: Session = Depends(get_db)
):
    
    try:
        results = search_documents(query, limit, faculty_id, similarity_threshold)
        
        return DocumentSearchResponse(
            results=results,
            total_results=len(results)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching documents: {str(e)}"
        )
    finally:
        db.close()
    
    