from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from app.core.security import get_current_user
from app.core.database import get_db
from app.models import LoginInfo as User
from app.services.s3_service import s3, BUCKET
from sqlalchemy.orm import Session
from app.services.rag_service import ingest_document_from_s3

router = APIRouter(tags=["notes"])

@router.post("/upload/", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key = f"notes/{current_user.username}/{file.filename}"
    try:
        content = await file.read()
        s3.put_object(Bucket=BUCKET, Key=key, Body=content)
        ingest_document_from_s3(db, BUCKET, key, current_user.logininfoid)
    except Exception:
        raise HTTPException(500, "Failed to upload file")
    return {"key": key}

@router.get("/list/", response_model=list[dict])
async def list_user_files(current_user: User = Depends(get_current_user)):
    prefix = f"notes/{current_user.username}/"
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
    items = resp.get("Contents", [])
    return [
        {
            "key": obj["Key"],
            "size_kb": round(obj["Size"] / 1024, 2),
            "last_modified": obj["LastModified"].isoformat()
        }
        for obj in items
    ]
