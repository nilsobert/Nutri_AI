from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta, date
from typing import Optional, List
from collections import defaultdict
from contextlib import asynccontextmanager
import httpx
import os
import base64
import json
import logging
import sys
import time
import uuid
from dotenv import load_dotenv
import os
import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import date
from sqlalchemy.orm import Session
from fastapi import Depends
from database import get_db, DailyMealSuggestion


from database import get_db, init_db, User, Meal, AnalysisLog, AnalysisStatus
from PIL import Image
from pydub import AudioSegment
import io
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from pydantic import BaseModel

load_dotenv()

# Rate limiting globals
MAX_REQUESTS_PER_MINUTE = 5
MAX_REQUESTS_PER_DAY = 5

# In-memory store for minute rate limiting
# Map user_id -> list of timestamps
user_request_timestamps = defaultdict(list)

# Configure logging
# Allow overriding via env var, e.g. LOG_LEVEL=WARNING or LOG_LEVEL=INFO
_log_level_str = os.getenv("LOG_LEVEL", "WARNING").upper()
_log_level = getattr(logging, _log_level_str, logging.WARNING)
logging.basicConfig(
    level=_log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("forward_proxy")
logger.warning(f"[Logging] LOG_LEVEL={_log_level_str} (numeric={_log_level})")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await health_check_external_services()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

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

@app.get("/health")
def health_check():
    return {"status": "ok"}

async def health_check_external_services():
    # Whisper Check
    whisper_url = os.getenv("WHISPER_API_URL", "http://pangolin.7cc.xyz:10303/transcribe")
    try:
        # Check connectivity to Whisper service
        # Use the /health endpoint which is standard for this service
        base_url = whisper_url.rsplit('/', 1)[0]
        health_url = f"{base_url}/health"
        
        async with httpx.AsyncClient(timeout=5.0) as client:
             try:
                 resp = await client.get(health_url)
                 if resp.status_code == 200:
                     logger.info(f"External services: Whisper ONLINE ({health_url}) - Status: {resp.status_code}")
                 else:
                     logger.warning(f"External services: Whisper ONLINE but returned {resp.status_code} ({health_url})")
             except Exception as e:
                 logger.error(f"External services: Whisper OFFLINE or Unreachable ({health_url}) - {e}")
    except Exception as e:
        logger.error(f"External services: Whisper Check Error ({e})")

    openrouter_base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

    if openrouter_base_url and openrouter_api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Authorization": f"Bearer {openrouter_api_key}"}
                # Try listing models as a lightweight check
                resp = await client.get(f"{openrouter_base_url}/models", headers=headers)
                if resp.status_code == 200:
                    logger.info("External services: OpenRouter ONLINE")
                else:
                    logger.error(f"External services: OpenRouter Check Failed with status {resp.status_code}")
        except Exception as e:
            logger.error(f"External services: OpenRouter Check Error ({e})")
    else:
        logger.warning("External services: OpenRouter Check Skipped (Missing Env Vars)")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    activity_level: Optional[str] = None
    medical_condition: Optional[str] = None
    weight_kg: Optional[int] = None
    motivation: Optional[str] = None
    target_weight_kg: Optional[int] = None
    weight_goal_type: Optional[str] = None
    weight_loss_rate: Optional[str] = None
    target_date: Optional[date] = None
    body_fat_percentage: Optional[int] = None
    protein_preference: Optional[str] = None
    custom_calories: Optional[int] = None
    custom_protein: Optional[int] = None
    custom_carbs: Optional[int] = None
    custom_fat: Optional[int] = None
    is_custom_goals: Optional[bool] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    activity_level: Optional[str] = None
    medical_condition: Optional[str] = None
    weight_kg: Optional[int] = None
    motivation: Optional[str] = None
    target_weight_kg: Optional[int] = None
    weight_goal_type: Optional[str] = None
    weight_loss_rate: Optional[str] = None
    target_date: Optional[date] = None
    body_fat_percentage: Optional[int] = None
    protein_preference: Optional[str] = None
    custom_calories: Optional[int] = None
    custom_protein: Optional[int] = None
    custom_carbs: Optional[int] = None
    custom_fat: Optional[int] = None
    is_custom_goals: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class NutritionInfoModel(BaseModel):
    calories: int
    carbs: int
    sugar: int
    protein: int
    fat: int

class MealQualityModel(BaseModel):
    calorieDensity: float
    goalFitPercentage: float
    mealQualityScore: float

class MealCreate(BaseModel):
    id: str
    timestamp: int
    category: str
    name: Optional[str] = None
    image: Optional[str] = None
    audio: Optional[str] = None
    transcription: Optional[str] = None
    nutritionInfo: NutritionInfoModel
    mealQuality: MealQualityModel

class MealResponse(MealCreate):
    pass

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
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def enforce_rate_limit(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = time.time()
    
    # 1. Daily Check and Reset
    today = date.today()
    # If last_reset_date is None (legacy users), treat as today or reset
    if user.last_reset_date is None or user.last_reset_date != today:
        user.quota_count = 0
        user.last_reset_date = today
        db.add(user)
        db.commit()
        db.refresh(user)
        
    if user.quota_count >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail="Daily limit reached"
        )
        
    # 2. Minute Check
    timestamps = user_request_timestamps[user.id]
    valid_timestamps = [t for t in timestamps if now - t < 60]
    user_request_timestamps[user.id] = valid_timestamps
    
    if len(valid_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Minute limit reached"
        )
        
    # Increment
    user.quota_count += 1
    db.add(user)
    db.commit()
    
    user_request_timestamps[user.id].append(now)
    return True

@app.get("/user/limits")
async def check_limits(user: User = Depends(get_current_user)):
    now = time.time()
    
    # Check Daily
    daily_remaining = MAX_REQUESTS_PER_DAY - user.quota_count
    if user.last_reset_date != date.today():
         daily_remaining = MAX_REQUESTS_PER_DAY
         
    # Check Minute
    timestamps = user_request_timestamps[user.id]
    valid_timestamps = [t for t in timestamps if now - t < 60]
    minute_remaining = MAX_REQUESTS_PER_MINUTE - len(valid_timestamps)
    
    is_allowed = daily_remaining > 0 and minute_remaining > 0
    
    return {
        "allowed": is_allowed,
        "daily_remaining": max(0, daily_remaining),
        "minute_remaining": max(0, minute_remaining)
    }

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
        last_reset_date=date.today(),
        name=user.name,
        age=user.age,
        gender=user.gender,
        height_cm=user.height_cm,
        activity_level=user.activity_level,
        medical_condition=user.medical_condition,
        weight_kg=user.weight_kg,
        motivation=user.motivation,
        target_weight_kg=user.target_weight_kg,
        weight_goal_type=user.weight_goal_type,
        weight_loss_rate=user.weight_loss_rate,
        target_date=user.target_date,
        body_fat_percentage=user.body_fat_percentage,
        protein_preference=user.protein_preference,
        custom_calories=user.custom_calories,
        custom_protein=user.custom_protein,
        custom_carbs=user.custom_carbs,
        custom_fat=user.custom_fat,
        is_custom_goals=1 if user.is_custom_goals else 0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.put("/profile")
def update_profile(profile: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile.name is not None: current_user.name = profile.name
    if profile.age is not None: current_user.age = profile.age
    if profile.gender is not None: current_user.gender = profile.gender
    if profile.height_cm is not None: current_user.height_cm = profile.height_cm
    if profile.activity_level is not None: current_user.activity_level = profile.activity_level
    if profile.medical_condition is not None: current_user.medical_condition = profile.medical_condition
    if profile.weight_kg is not None: current_user.weight_kg = profile.weight_kg
    if profile.motivation is not None: current_user.motivation = profile.motivation
    if profile.target_weight_kg is not None: current_user.target_weight_kg = profile.target_weight_kg
    if profile.weight_goal_type is not None: current_user.weight_goal_type = profile.weight_goal_type
    if profile.weight_loss_rate is not None: current_user.weight_loss_rate = profile.weight_loss_rate
    if profile.target_date is not None: current_user.target_date = profile.target_date
    if profile.body_fat_percentage is not None: current_user.body_fat_percentage = profile.body_fat_percentage
    if profile.protein_preference is not None: current_user.protein_preference = profile.protein_preference
    if profile.custom_calories is not None: current_user.custom_calories = profile.custom_calories
    if profile.custom_protein is not None: current_user.custom_protein = profile.custom_protein
    if profile.custom_carbs is not None: current_user.custom_carbs = profile.custom_carbs
    if profile.custom_fat is not None: current_user.custom_fat = profile.custom_fat
    if profile.is_custom_goals is not None: current_user.is_custom_goals = 1 if profile.is_custom_goals else 0
    
    db.commit()
    return {"message": "Profile updated successfully"}

@app.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.name,
        "age": current_user.age,
        "gender": current_user.gender,
        "height_cm": current_user.height_cm,
        "activity_level": current_user.activity_level,
        "medical_condition": current_user.medical_condition,
        "weight_kg": current_user.weight_kg,
        "motivation": current_user.motivation,
        "target_weight_kg": current_user.target_weight_kg,
        "weight_goal_type": current_user.weight_goal_type,
        "weight_loss_rate": current_user.weight_loss_rate,
        "target_date": current_user.target_date,
        "body_fat_percentage": current_user.body_fat_percentage,
        "protein_preference": current_user.protein_preference,
        "custom_calories": current_user.custom_calories,
        "custom_protein": current_user.custom_protein,
        "custom_carbs": current_user.custom_carbs,
        "custom_fat": current_user.custom_fat,
        "is_custom_goals": bool(current_user.is_custom_goals) if current_user.is_custom_goals is not None else False,
    }

@app.post("/profile/image")
async def upload_profile_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure directory exists
    os.makedirs("data/images", exist_ok=True)
    
    file_path = f"data/images/{current_user.id}.jpg"
    
    with open(file_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
        
    current_user.profile_image_path = file_path
    db.commit()
    
    return {"message": "Profile image uploaded successfully"}

@app.get("/profile/image")
def get_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile_image_path or not os.path.exists(current_user.profile_image_path):
        raise HTTPException(status_code=404, detail="Profile image not found")
        
    return FileResponse(current_user.profile_image_path)

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
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/meals", response_model=MealResponse)
def create_meal(meal: MealCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create or update a meal.

    This endpoint is intentionally **idempotent** by `meal.id` scoped to the authenticated user.

    Why: the mobile app may retry / or run concurrent queue workers during reconnect.
    We therefore must never return 500 for duplicate IDs.
    """
    
    # Quota Check
    if not check_quota_and_update(current_user, db):
        logger.warning(f"User {current_user.id} exceeded daily quota (create_meal)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached."
        )

    logger.info(f"[POST /meals] Creating/Updating meal {meal.id} for user {current_user.id} (email: {current_user.email})")
    logger.debug(f"[POST /meals] Meal data: category={meal.category}, timestamp={meal.timestamp}, name={meal.name}, has_image={bool(meal.image)}, has_audio={bool(meal.audio)}, has_transcription={bool(meal.transcription)}")

    # First try: normal read-then-update/insert path.
    # IMPORTANT: Scope to the current user to prevent cross-user overwrites.
    existing_meal = db.query(Meal).filter(Meal.id == meal.id, Meal.user_id == current_user.id).first()
    if existing_meal:
        logger.info(f"[POST /meals] Updating existing meal {meal.id} for user {current_user.id}")
        logger.debug(f"[POST /meals] Old meal: category={existing_meal.category}, has_image={bool(existing_meal.image_path)}, has_audio={bool(existing_meal.audio_path)}")

        existing_meal.timestamp = meal.timestamp
        existing_meal.category = meal.category
        existing_meal.name = meal.name
        existing_meal.image_path = meal.image
        existing_meal.audio_path = meal.audio
        existing_meal.transcription = meal.transcription
        existing_meal.calories = meal.nutritionInfo.calories
        existing_meal.carbs = meal.nutritionInfo.carbs
        existing_meal.sugar = meal.nutritionInfo.sugar
        existing_meal.protein = meal.nutritionInfo.protein
        existing_meal.fat = meal.nutritionInfo.fat
        existing_meal.calorie_density = meal.mealQuality.calorieDensity
        existing_meal.goal_fit_percentage = meal.mealQuality.goalFitPercentage
        existing_meal.meal_quality_score = meal.mealQuality.mealQualityScore
        db.commit()
        db.refresh(existing_meal)
        return meal

    db_meal = Meal(
        id=meal.id,
        user_id=current_user.id,
        timestamp=meal.timestamp,
        category=meal.category,
        name=meal.name,
        image_path=meal.image,
        audio_path=meal.audio,
        transcription=meal.transcription,
        calories=meal.nutritionInfo.calories,
        carbs=meal.nutritionInfo.carbs,
        sugar=meal.nutritionInfo.sugar,
        protein=meal.nutritionInfo.protein,
        fat=meal.nutritionInfo.fat,
        calorie_density=meal.mealQuality.calorieDensity,
        goal_fit_percentage=meal.mealQuality.goalFitPercentage,
        meal_quality_score=meal.mealQuality.mealQualityScore
    )

    db.add(db_meal)
    try:
        db.commit()
    except IntegrityError:
        # Race condition safe-guard: another request inserted the same primary key concurrently.
        # Treat as idempotent success by fetching & updating.
        db.rollback()
        logger.warning(f"[POST /meals] IntegrityError on insert for meal {meal.id}. Falling back to update.")

        existing_meal = db.query(Meal).filter(Meal.id == meal.id, Meal.user_id == current_user.id).first()
        if not existing_meal:
            # If this happens, it was likely a conflicting PK from another user (schema uses id as global PK).
            # Signal conflict rather than 500.
            raise HTTPException(status_code=409, detail="Meal ID already exists")

        existing_meal.timestamp = meal.timestamp
        existing_meal.category = meal.category
        existing_meal.name = meal.name
        existing_meal.image_path = meal.image
        existing_meal.audio_path = meal.audio
        existing_meal.transcription = meal.transcription
        existing_meal.calories = meal.nutritionInfo.calories
        existing_meal.carbs = meal.nutritionInfo.carbs
        existing_meal.sugar = meal.nutritionInfo.sugar
        existing_meal.protein = meal.nutritionInfo.protein
        existing_meal.fat = meal.nutritionInfo.fat
        existing_meal.calorie_density = meal.mealQuality.calorieDensity
        existing_meal.goal_fit_percentage = meal.mealQuality.goalFitPercentage
        existing_meal.meal_quality_score = meal.mealQuality.mealQualityScore
        db.commit()
        db.refresh(existing_meal)
        return meal

    db.refresh(db_meal)
    logger.info(f"[POST /meals] Meal {meal.id} created successfully for user {current_user.id}")
    return meal

@app.get("/meals", response_model=List[MealResponse])
def get_meals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"[GET /meals] Fetching meals for user {current_user.id} (email: {current_user.email})")
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).all()
    logger.info(f"[GET /meals] Found {len(meals)} meals for user {current_user.id}")
    if meals:
        logger.debug(f"[GET /meals] Meal IDs: {[m.id for m in meals]}")
    return [
        MealResponse(
            id=m.id,
            timestamp=m.timestamp,
            category=m.category,
            name=m.name,
            image=m.image_path,
            audio=m.audio_path,
            transcription=m.transcription,
            nutritionInfo=NutritionInfoModel(
                calories=m.calories,
                carbs=m.carbs,
                sugar=m.sugar,
                protein=m.protein,
                fat=m.fat
            ),
            mealQuality=MealQualityModel(
                calorieDensity=m.calorie_density,
                goalFitPercentage=m.goal_fit_percentage,
                mealQualityScore=m.meal_quality_score
            )
        ) for m in meals
    ]

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"[DELETE /meals/{meal_id}] Deleting meal for user {current_user.id} (email: {current_user.email})")
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        logger.warning(f"[DELETE /meals/{meal_id}] Meal not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Meal not found")
    logger.debug(f"[DELETE /meals/{meal_id}] Deleting meal with image_path={meal.image_path}, audio_path={meal.audio_path}")
    db.delete(meal)
    db.commit()
    logger.info(f"[DELETE /meals/{meal_id}] Meal deleted successfully for user {current_user.id}")
    return {"message": "Meal deleted"}

@app.post("/meals/image")
async def upload_meal_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"[POST /meals/image] Uploading meal image for user {current_user.id} (email: {current_user.email})")
    logger.debug(f"[POST /meals/image] File: {image.filename}, content_type: {image.content_type}")
    os.makedirs("data/meal_images", exist_ok=True)
    file_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    relative_path = f"meal_images/{file_name}"
    file_path = f"data/{relative_path}"
    
    with open(file_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    logger.info(f"[POST /meals/image] Image saved to {file_path} ({len(content)} bytes)")
    return {"image_path": relative_path}

@app.post("/meals/audio")
async def upload_meal_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"[POST /meals/audio] Uploading meal audio for user {current_user.id} (email: {current_user.email})")
    logger.debug(f"[POST /meals/audio] File: {audio.filename}, content_type: {audio.content_type}")
    os.makedirs("data/meal_audios", exist_ok=True)
    file_ext = audio.filename.split(".")[-1] if "." in audio.filename else "m4a"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    relative_path = f"meal_audios/{file_name}"
    file_path = f"data/{relative_path}"

    with open(file_path, "wb") as buffer:
        content = await audio.read()
        buffer.write(content)

    logger.info(f"[POST /meals/audio] Audio saved to {file_path} ({len(content)} bytes)")
    return {"audio_path": relative_path}

@app.get("/static/{file_path:path}")
def get_static_file(file_path: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Serve static files only if they belong to the authenticated user.

    Currently we only store meal images under data/meal_images/ and audios under data/meal_audios/.
    """
    logger.info(f"[GET /static/{file_path}] Serving static file for user {current_user.id} (email: {current_user.email})")
    
    # Prevent directory traversal
    if ".." in file_path or file_path.startswith("/"):
        logger.warning(f"[GET /static/{file_path}] Directory traversal attempt detected for user {current_user.id}")
        raise HTTPException(status_code=400, detail="Invalid path")

    # Only allow access to meal images + audios via this endpoint
    if not (file_path.startswith("meal_images/") or file_path.startswith("meal_audios/")):
        logger.warning(f"[GET /static/{file_path}] Unauthorized file type access attempt for user {current_user.id}")
        raise HTTPException(status_code=403, detail="Not allowed")

    # Authorization: ensure this file_path belongs to one of the user's meals
    meal = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        (Meal.image_path == file_path) | (Meal.audio_path == file_path)
    ).first()
    if not meal:
        logger.warning(f"[GET /static/{file_path}] File not found or not owned by user {current_user.id}")
        raise HTTPException(status_code=404, detail="File not found")

    full_path = os.path.join("data", file_path)
    if not os.path.exists(full_path):
        logger.error(f"[GET /static/{file_path}] File exists in DB but not on disk for user {current_user.id}")
        raise HTTPException(status_code=404, detail="File not found")

    logger.debug(f"[GET /static/{file_path}] Serving file successfully for user {current_user.id}")
    return FileResponse(full_path)

def check_quota_and_update(user: User, db: Session) -> bool:
    now = time.time()
    today = date.today()
    
    # 1. Check if we need to reset for a new day
    if user.last_reset_date != today:
        user.quota_count = 0
        user.last_reset_date = today
        # We don't return here, we proceed to check limits (it will be 0)
        
    # 2. Check Daily Limit
    if user.quota_count >= MAX_REQUESTS_PER_DAY:
        return False # Denied
        
    # 3. Check Minute Limit
    timestamps = user_request_timestamps[user.id]
    valid_timestamps = [t for t in timestamps if now - t < 60]
    user_request_timestamps[user.id] = valid_timestamps # Cleanup
    
    if len(valid_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        return False # Denied

    # 4. Increment request
    user.quota_count += 1
    db.commit()
    
    user_request_timestamps[user.id].append(now)
    return True
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
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    model = "qwen/qwen3-vl-235b-a22b-instruct"
    
    if not api_key or not base_url:
         logger.critical("Missing OpenRouter credentials")
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
                "meal_quality" : 9, 
                "goal_fit_percent" : 0.9,
                "calorie_density_cal_per_gram" : 1.65
              }
            }
          ],
          "errorMessage": null
        }
        """
        
        prompt_text = f"""Analyze the attached meal image and provide ONE aggregate meal object for the whole meal. Estimate the meal’s weight in grams, and list its core nutritional facts.

        Be highly conservative with portion sizes and fat content: assume standard restaurant portions (approx. 100-150g for proteins) and only estimate high fat/carb values if visible oil, frying, or large starch portions are clearly evident.
        Return a JSON object matching this exact schema:

{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis.
- `items`: Create one object for *each* distinct food item in the image.
- `confidence`: Your confidence (0.0 to 1.0).
- `serving_size_grams`: Your best estimate of the item's weight in grams.
- `nutrition`: The nutritional info for that *single item*.
- `meal_quality`: Estimate a reasonable natural number between 0 and 10, where 0 is worst meal quality.
- `goal_fit_percent`: Set to a reasonable value between 0 and 1 based on the user's selected goal.
- `calorie_density_cal_per_gram`: With the estimated meal calories and weight, calculate the calorie density of the meal.
- `errorMessage`: Set to a reason if `success` is `false`, otherwise `null`.

Return *only* the JSON object and nothing else."""

        user_goal_info = get_user_goal_context(current_user)
        if user_goal_info:
            prompt_text += f"\n\nUser Profile & Goals:\n{user_goal_info}"

        if transcript:
            prompt_text += f"\n\nAdditional Context from Audio Note: {transcript}"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MealTracker"
        }
        
        payload = {
            "model": model,
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
        
        logger.info(f"Calling VLM API at {base_url}")
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=60.0)
            
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

async def transcribe_audio(audio_path: str, content_type: str = "audio/wav"):
    whisper_url = os.getenv("WHISPER_API_URL", "http://pangolin.7cc.xyz:10303/transcribe")
    whisper_key = os.getenv("WHISPER_API_KEY", "1234")
    
    # Convert to WAV if needed
    wav_path = audio_path
    is_converted = False
    if not audio_path.lower().endswith(".wav"):
        try:
            logger.info(f"Converting {audio_path} to WAV")
            audio = AudioSegment.from_file(audio_path)
            # Set to 16kHz, mono, 16-bit as recommended by Whisper
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            wav_path = os.path.splitext(audio_path)[0] + ".wav"
            audio.export(wav_path, format="wav")
            is_converted = True
            logger.info(f"Converted to {wav_path}")
        except Exception as e:
            logger.error(f"Failed to convert audio: {e}")
            # Fallback to original file if conversion fails
            pass

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Determine correct mime type
            mime_type = "audio/wav" if is_converted or wav_path.lower().endswith(".wav") else content_type
            
            with open(wav_path, "rb") as f:
                files = {'file': (os.path.basename(wav_path), f, mime_type)}
                headers = {"X-API-Key": whisper_key}
                
                logger.info(f"[ExternalAPI] Calling Whisper API at {whisper_url} with mime_type={mime_type}")
                response = await client.post(whisper_url, headers=headers, files=files, data={"language": "en"})
                
        duration = time.time() - start_time
        logger.info(f"[ExternalAPI] Whisper took {duration:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            return result.get("text", ""), result
        else:
            logger.error(f"Whisper API Error: {response.status_code} - {response.text}")
            return "", {"error": response.text, "status_code": response.status_code}
            
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"[ExternalAPI] Whisper failed after {duration:.2f}s: {e}")
        return "", {"error": str(e)}

def get_user_goal_context(user: User) -> str:
    context_parts = []
    if user.motivation:
        context_parts.append(f"User Motivation: {user.motivation}")
    
    if user.medical_condition:
        context_parts.append(f"Medical Condition: {user.medical_condition}")
        
    if user.weight_goal_type:
        context_parts.append(f"Weight Goal: {user.weight_goal_type}")
        
    if user.protein_preference:
         context_parts.append(f"Protein Preference: {user.protein_preference}")
         
    return "\n".join(context_parts)

async def analyze_image_vlm(image_path: str, context: str = "", user_goal_info: str = ""):
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    model = "qwen/qwen3-vl-235b-a22b-instruct"

    if not api_key or not base_url:
         raise Exception("Missing OpenRouter credentials")

    # Resize image if needed
    try:
        file_size = os.path.getsize(image_path)
        if file_size > 2 * 1024 * 1024: # 2MB
            logger.info(f"Image size {file_size} bytes > 2MB. Resizing...")
            with Image.open(image_path) as img:
                img.thumbnail((1024, 1024))
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85)
                image_content = buffer.getvalue()
        else:
            with open(image_path, "rb") as f:
                image_content = f.read()
    except Exception as e:
        logger.warning(f"Image processing failed: {e}. Using original file.")
        with open(image_path, "rb") as f:
            image_content = f.read()

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
            "meal_quality" : 9, 
            "goal_fit_percent" : 0.9,
            "calorie_density_cal_per_gram" : 1.65
          }
        }
      ],
      "errorMessage": null
    }
    """
    
    prompt_text = f"""Analyze the attached meal image and provide ONE aggregate meal object for the whole meal. Estimate the meal’s weight in grams, and list its core nutritional facts.
    
    Be highly conservative with portion sizes and fat content: assume standard restaurant portions (approx. 100-150g for proteins) and only estimate high fat/carb values if visible oil, frying, or large starch portions are clearly evident.    
    Return a JSON object matching this exact schema:
{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis.
- `items`: Create one object for *each* distinct food item in the image.
- `confidence`: Your confidence (0.0 to 1.0).
- `serving_size_grams`: Your best estimate of the item's weight in grams.
- `nutrition`: The nutritional info for that *single item*.
- `meal_quality`: Estimate a reasonable natural number between 0 and 10, where 0 is worst meal quality.
- `goal_fit_percent`: Set to a reasonable value between 0 and 1 based on the user's selected goal.
- `calorie_density_cal_per_gram`: With the estimated meal calories and weight, calculate the calorie density of the meal.
- `errorMessage`: Set to a reason if `success` is `false`, otherwise `null`.

Return *only* the JSON object and nothing else."""

    if user_goal_info:
        prompt_text += f"\n\nUser Profile & Goals:\n{user_goal_info}"

    if context:
        prompt_text += f"\n\n{context}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MealTracker"
    }
    
    payload = {
        "model": model,
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
    
    logger.info(f"[ExternalAPI] Calling VLM API at {base_url}")
    logger.info(f"Prompt (truncated): {prompt_text[:500]}...")
    logger.debug(f"Full Prompt: {prompt_text}")
    
    start_time = time.time()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
    
    duration = time.time() - start_time
    logger.info(f"[ExternalAPI] VLM took {duration:.2f}s")
        
    if response.status_code != 200:
         logger.error(f"AI Provider Error: {response.status_code} - {response.text}")
         return {"error": response.text}, response.json() if response.headers.get("content-type") == "application/json" else response.text, prompt_text
         
    ai_result = response.json()
    content = ai_result["choices"][0]["message"]["content"]
    
    # Parse JSON
    try:
        if "```json" in content:
            parsed_content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            parsed_content = content.split("```")[1].split("```")[0].strip()
        else:
            parsed_content = content
        
        json_obj = json.loads(parsed_content)
        logger.info("[Parser] Successfully extracted JSON")
        return json_obj, ai_result, prompt_text
    except Exception as e:
        logger.error(f"[Parser] Failed to parse JSON: {e}")
        logger.debug(f"Raw content: {content}")
        return {"error": "Failed to parse JSON", "raw": content}, ai_result, prompt_text

@app.post("/api/analyze")
async def analyze_meal(
    image: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None),
    context_text: Optional[str] = Form(None),
    client_timestamp: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request_start_time = time.time()
    analysis_id = str(uuid.uuid4())
    
    # 1. Ingest & Store
    # Save files
    os.makedirs(f"data/temp/{current_user.id}", exist_ok=True)
    
    image_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    image_path = f"data/temp/{current_user.id}/{analysis_id}.{image_ext}"
    
    with open(image_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
        
    audio_path = None
    if audio:
        audio_ext = audio.filename.split(".")[-1] if "." in audio.filename else "mp3"
        audio_path = f"data/temp/{current_user.id}/{analysis_id}.{audio_ext}"
        with open(audio_path, "wb") as buffer:
            audio_content = await audio.read()
            buffer.write(audio_content)
            
    # Create Log
    log_entry = AnalysisLog(
        id=analysis_id,
        user_id=current_user.id,
        image_path=image_path,
        audio_path=audio_path,
        status=AnalysisStatus.PENDING.value
    )
    db.add(log_entry)
    db.commit()
    
    try:
        # 2. Transcribe
        transcript = ""
        if audio_path:
            transcript, raw_whisper = await transcribe_audio(audio_path, audio.content_type if audio else "audio/wav")
            log_entry.transcription_text = transcript
            log_entry.transcription_raw_response = json.dumps(raw_whisper) if raw_whisper else None
            db.commit()
            
        # 3. VLM Analysis
        full_context = ""
        if transcript:
            full_context += f"Additional Context from Audio Note: {transcript}\n"
        if context_text:
            full_context += f"Additional Context from User Description: {context_text}\n"
            
        user_goal_info = get_user_goal_context(current_user)
        vlm_response, raw_vlm, prompt_used = await analyze_image_vlm(image_path, full_context, user_goal_info)
        
        log_entry.vlm_request_prompt = prompt_used
        log_entry.vlm_raw_response = json.dumps(raw_vlm) if raw_vlm else None
        
        # 4. Finalize
        if "error" in vlm_response:
             log_entry.status = AnalysisStatus.FAILURE.value
        else:
             log_entry.status = AnalysisStatus.SUCCESS.value
             
        log_entry.processing_duration_ms = int((time.time() - request_start_time) * 1000)
        db.commit()
        
        return {
            "analysis_id": analysis_id,
            "transcription": transcript,
            "structured_meal": vlm_response
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        log_entry.status = AnalysisStatus.FAILURE.value
        log_entry.processing_duration_ms = int((time.time() - request_start_time) * 1000)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    




from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
import os, httpx, json, logging
from datetime import date

# --- Pydantic models for request/response ---

class NutritionRequest(BaseModel):
    remaining_calories: int
    remaining_protein: int
    remaining_carbs: int
    remaining_fat: int
    last_meal: int  # 0 = breakfast not served, etc.

class NutritionInfo(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int

class MealSuggestion(BaseModel):
    name: str
    description: str
    nutrition: NutritionInfo

class MealSuggestionsResponse(BaseModel):
    breakfast: MealSuggestion
    lunch: MealSuggestion
    dinner: MealSuggestion

# --- Dummy dependency for authentication ---
def get_current_user():
    return {"id": "user_123", "email": "user@example.com"}

# --- Suggest meals endpoint ---
@app.post("/api/suggest-meals", response_model=MealSuggestionsResponse)
async def suggest_meals(
    request: NutritionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    today = date.today()

    logger.info(f"[Meal Suggestion] User={user_id} Date={today}")

    # 1️⃣ Check if today's suggestions already exist
    existing = (
        db.query(DailyMealSuggestion)
        .filter(DailyMealSuggestion.user_id == user_id,
                DailyMealSuggestion.date == today)
        .all()
    )

    if existing:
        logger.info("Returning cached meal suggestions")

        def build(meal_type):
            m = next(x for x in existing if x.meal_type == meal_type)
            return {
                "name": m.name,
                "description": m.description,
                "nutrition": {
                    "calories": m.calories,
                    "protein": m.protein,
                    "carbs": m.carbs,
                    "fat": m.fat,
                },
            }

        return {
            "breakfast": build("breakfast"),
            "lunch": build("lunch"),
            "dinner": build("dinner"),
        }

    # 2️⃣ Generate suggestions via LLM
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

    if not OPENAI_API_KEY or not OPENAI_BASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfiguration")

    prompt = f"""You are a helpful nutrition assistant.

Based on the remaining nutrients for today:
- Calories: {request.remaining_calories} kcal
- Protein: {request.remaining_protein} g
- Carbs: {request.remaining_carbs} g
- Fat: {request.remaining_fat} g

The value of lastMeal is: {request.last_meal}

Rules:
- lastMeal = 0 → generate breakfast, lunch, and dinner
- lastMeal = 1 → generate lunch and dinner only, breakfast should have name "none"
- lastMeal = 2 → generate dinner only, breakfast and lunch should have name "none"
- For any meal that should not be served, set:
  {{
    "name": "none",
    "description": "",
    "nutrition": {{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}
  }}

Output format:
- Return a JSON object with exactly three keys: "breakfast", "lunch", "dinner"
- Each key maps to an object with:
  - "name": string
  - "description": string
  - "nutrition": object with keys "calories", "protein", "carbs", "fat" (all numbers)
- Do not include any text outside of the JSON.
- Always use lowercase keys for meals and nutrition.
"""

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4.1",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 512,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{OPENAI_BASE_URL}/chat/completions",
                                         headers=headers, json=payload)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="LLM API error")

        content = response.json()["choices"][0]["message"]["content"]

        # Remove code fences if present
        if "```" in content:
            content = content.split("```")[-2].strip()

        suggestions: Dict[str, Dict] = json.loads(content)

    except Exception as e:
        logger.error(f"LLM generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")

    # 3️⃣ Save suggestions to DB
    for meal_type in ["breakfast", "lunch", "dinner"]:
        meal = suggestions.get(meal_type)
        if not meal:
            # Skip missing meals (should not happen with improved prompt)
            continue

        # Safe defaults in case keys are missing
        name = meal.get("name", "none")
        description = meal.get("description", "")
        nutrition = meal.get("nutrition", {})
        calories = nutrition.get("calories", 0)
        protein = nutrition.get("protein", 0)
        carbs = nutrition.get("carbs", 0)
        fat = nutrition.get("fat", 0)

        db.add(DailyMealSuggestion(
            user_id=user_id,
            date=today,
            meal_type=meal_type,
            name=name,
            description=description,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
        ))

    db.commit()
    logger.info("Meal suggestions generated and saved")
    return suggestions


    








@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"[DELETE /meals/{meal_id}] Deleting meal for user {current_user.id}")
    
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
        
    db.delete(meal)
    db.commit()
    
    logger.info(f"[DELETE /meals/{meal_id}] Meal deleted successfully")
    return {"message": "Meal deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    
    # Force SSL as requested
    if not os.path.exists("key.pem"):
        logger.critical("SSL Error: key.pem not found in application directory. Please ensure key.pem is present.")
        sys.exit(1)
        
    if not os.path.exists("cert.pem"):
        logger.critical("SSL Error: cert.pem not found in application directory. Please ensure cert.pem is present.")
        sys.exit(1)

    logger.info("Starting server with SSL enabled")
    uvicorn.run(app, host="0.0.0.0", port=7770, ssl_keyfile="key.pem", ssl_certfile="cert.pem")






