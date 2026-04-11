import os
import urllib.request
import json
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta

load_dotenv()

# Keep old password hashing so auth_router.py doesn't break, though standard auth dominates now
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=43200))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv("SECRET_KEY", "your-secret-key"), algorithm=os.getenv("ALGORITHM", "HS256"))

# --- SUPABASE JWKS VERIFICATION ---
security = HTTPBearer()

_JWKS_CACHE = None

def get_jwks():
    global _JWKS_CACHE
    if _JWKS_CACHE is not None:
        return _JWKS_CACHE

    supabase_url = (
        os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        or os.getenv("VITE_SUPABASE_URL", "").strip().rstrip("/")
    )
    if not supabase_url:
        raise HTTPException(
            status_code=503,
            detail=(
                "SUPABASE_URL is not set. Local: add to backend/.env. "
                "Cloud Run: set env var SUPABASE_URL on the service (same value as Supabase Settings → API → Project URL, e.g. https://xxxxx.supabase.co)."
            ),
        )
        
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    
    try:
        with urllib.request.urlopen(jwks_url) as response:
            _JWKS_CACHE = json.loads(response.read().decode())
            return _JWKS_CACHE
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch JWKS securely from {jwks_url}: {e}"
        )

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    jwks = get_jwks()
    
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")

    rsa_key = {}
    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header.get("kid"):
            rsa_key = {k: v for k, v in key.items()}
            break

    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key to verify token",
        )
        
    try:
        # Supabase ECC (P-256) is ES256, legacy is HS256/RS256. 
        # python-jose automatically handles the JWK payload.
        # We disable aud/iss tracking initially for maximum flexibility with multiple URLs.
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256", "ES256", "HS256"],
            options={"verify_aud": False, "verify_iss": False}
        )
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token signature: {str(e)}")
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing sub claim")
        
    return user_id
