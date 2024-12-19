from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..core.database import SessionLocal
from ..core.auth import Auth0Handler
from ..models.user import User

auth0_handler = Auth0Handler()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user_token(
    token: str = Depends(oauth2_scheme)
) -> dict:
    return await auth0_handler.verify_token(token)

async def get_current_user(
    token: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
) -> User:
    try:
        user = db.query(User).filter(User.auth0_id == token.get("sub")).first()
        if not user:
            # Create a new user if they don't exist
            user = User(
                auth0_id=token.get("sub"),
                email=token.get("email"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )