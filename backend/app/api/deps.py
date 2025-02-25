from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..core.security import get_current_user
from app.models import LoginInfo as User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.isactive:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.issuperuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return current_user