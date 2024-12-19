from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
import httpx
from .config import settings

class Auth0Handler:
    def __init__(self):
        self.domain = settings.AUTH0_DOMAIN
        self.api_audience = settings.AUTH0_API_AUDIENCE
        self.algorithms = ["RS256"]
        self.jwks = None
        self._fetch_jwks()

    def _fetch_jwks(self):
        url = f"https://{self.domain}/.well-known/jwks.json"
        response = httpx.get(url)
        self.jwks = response.json()

    async def verify_token(self, token: str) -> dict:
        try:
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in self.jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "n": key["n"],
                        "e": key["e"]
                    }
            if rsa_key:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=self.algorithms,
                    audience=self.api_audience,
                    issuer=f"https://{self.domain}/"
                )
                return payload
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
            )
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )