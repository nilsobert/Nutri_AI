from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta, date
from typing import Optional
import httpx
import os
import base64
import json
import logging
import sys
import time
from dotenv import load_dotenv

from database import get_db, init_db, User
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from pydantic import BaseModel

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("forward_proxy")

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    request_id = f"{time.time()}-{os.urandom(4).hex()}"
    
    logger.info(f"[{request_id}] Incoming request: {request.method} {request.url}")
    
    # Log headers (be careful with sensitive info like Authorization)
    headers = dict(request.headers)
    if "authorization" in headers:
        headers["authorization"] = "Bearer ***"
    logger.info(f"[{request_id}] Headers: {headers}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"[{request_id}] Response status: {response.status_code} - Took: {process_time:.4f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"[{request_id}] Request failed: {str(e)} - Took: {process_time:.4f}s", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# Initialize DB
init_db()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MealTrackResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        quota_count=0,
        last_reset_date=date.today()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def check_quota_and_update(user: User, db: Session) -> bool:
    today = date.today()
    
    # 1. Check if we need to reset for a new day
    if user.last_reset_date != today:
        user.quota_count = 1
        user.last_reset_date = today
        db.commit()
        return True # Allowed
        
    # 2. Check if limit is reached
    if user.quota_count >= 10:
        return False # Denied
        
    # 3. Increment request
    user.quota_count += 1
    db.commit()
    return True # Allowed

@app.post("/api/track-meal")
async def track_meal(
    image: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Processing track_meal for user {current_user.id}")
    
    # Quota Check
    if not check_quota_and_update(current_user, db):
        logger.warning(f"User {current_user.id} exceeded daily quota")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached."
        )

    transcript = ""
    
    # 1. Handle Audio (Whisper)
    if audio:
        logger.info("Audio file provided, attempting transcription")
        whisper_url = os.getenv("WHISPER_API_URL", "http://pangolin.7cc.xyz:10303/transcribe")
        whisper_key = os.getenv("WHISPER_API_KEY", "1234")
        
        try:
            audio_content = await audio.read()
            files = {'file': (audio.filename, audio_content, audio.content_type)}
            headers = {"X-API-Key": whisper_key}
            
            logger.info(f"Calling Whisper API at {whisper_url}")
            async with httpx.AsyncClient() as client:
                response = await client.post(whisper_url, headers=headers, files=files, data={"language": "en"})
                
            if response.status_code == 200:
                result = response.json()
                transcript = result.get("text", "")
                logger.info(f"Transcription successful: {transcript[:50]}...")
            else:
                logger.error(f"Whisper API Error: {response.status_code} - {response.text}")
                # We continue even if whisper fails, just without transcript
        except Exception as e:
            logger.error(f"Whisper Exception: {e}", exc_info=True)

    # 2. Handle Image (VLM)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openai_base_url = os.getenv("OPENAI_BASE_URL")
    
    if not openai_api_key or not openai_base_url:
         logger.critical("Missing OpenAI credentials")
         raise HTTPException(status_code=500, detail="Server misconfiguration: Missing AI credentials")

    try:
        logger.info("Processing image for VLM analysis")
        image_content = await image.read()
        base64_image = base64.b64encode(image_content).decode('utf-8')
        
        json_schema_template = """
        {
          "success": true,
          "requestId": "img_analysis_...",
          "items": [
            {
              "name": "Grilled Chicken Breast",
              "confidence": 0.9,
              "serving_size_grams": 150,
              "nutrition": {
                "calories": 248,
                "protein_g": 46.5,
                "fat_g": 5.4,
                "carbohydrates_g": 0,
                "sugar_g": 0,
                "fiber_g": 0
              }
            }
          ],
          "errorMessage": null
        }
        """
        
        prompt_text = f"""Analyze the attached meal image and provide a detailed nutritional breakdown. Identify each distinct food item, estimate its weight in grams, and list its core nutritional facts.

Return a JSON object matching this exact schema:
{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis.
- `items`: Create one object for *each* distinct food item in the image.
- `confidence`: Your confidence (0.0 to 1.0).
- `serving_size_grams`: Your best estimate of the item's weight in grams.
- `nutrition`: The nutritional info for that *single item*.
- `errorMessage`: Set to a reason if `success` is `false`, otherwise `null`.

Return *only* the JSON object and nothing else."""

        if transcript:
            prompt_text += f"\n\nAdditional Context from Audio Note: {transcript}"

        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "Qwen2.5-VL-72B-Instruct",
            "messages": [
                {
                    "role": "system", 
                    "content": "You are an expert nutrition assistant. Respond only with the requested JSON object."
                },
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.0,
            "max_tokens": 2048
        }
        
        logger.info(f"Calling VLM API at {openai_base_url}")
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{openai_base_url}/chat/completions", headers=headers, json=payload, timeout=60.0)
            
        if response.status_code != 200:
             logger.error(f"AI Provider Error: {response.status_code} - {response.text}")
             raise HTTPException(status_code=500, detail=f"AI Provider Error: {response.text}")
             
        ai_result = response.json()
        content = ai_result["choices"][0]["message"]["content"]
        logger.info("VLM response received")
        
        # Parse JSON from content (it might be wrapped in markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

    except Exception as e:
        logger.error(f"VLM Exception: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, ssl_keyfile="key.pem", ssl_certfile="cert.pem")
