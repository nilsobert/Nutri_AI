from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta, date
from typing import Optional, List
import httpx
import os
import base64
import json
import logging
import sys
import time
import uuid
from dotenv import load_dotenv

from database import get_db, init_db, User, Meal
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ai_meal_analysis import analyze_meal_image
from audio_service import transcribe_audio
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
    logger.info(f"[POST /meals] Creating/Updating meal {meal.id} for user {current_user.id} (email: {current_user.email})")
    logger.debug(f"[POST /meals] Meal data: category={meal.category}, timestamp={meal.timestamp}, has_image={bool(meal.image)}, has_audio={bool(meal.audio)}, has_transcription={bool(meal.transcription)}")
    
    # Check if meal already exists to avoid duplicates or handle updates
    # IMPORTANT: Scope to the current user to prevent cross-user overwrites
    existing_meal = db.query(Meal).filter(Meal.id == meal.id, Meal.user_id == current_user.id).first()
    if existing_meal:
        logger.info(f"[POST /meals] Updating existing meal {meal.id} for user {current_user.id}")
        logger.debug(f"[POST /meals] Old meal: category={existing_meal.category}, has_image={bool(existing_meal.image_path)}, has_audio={bool(existing_meal.audio_path)}")
        # Update existing meal
        existing_meal.timestamp = meal.timestamp
        existing_meal.category = meal.category
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
    db.commit()
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
        try:
            audio_content = await audio.read()
            transcript = await transcribe_audio(audio_content, audio.filename)
            logger.info(f"Transcription successful: {transcript[:50]}...")
        except Exception as e:
            logger.error(f"Whisper Exception: {e}", exc_info=True)
            # We continue even if whisper fails, just without transcript

    # 2. Handle Image (VLM)
    try:
        logger.info("Processing image for VLM analysis")
        image_content = await image.read()
        
        text_context = None
        if transcript:
            text_context = f"Additional Context from Audio Note: {transcript}"
            
        result = await analyze_meal_image(image_content, text_context)
        
        # Inject transcript into result if successful
        if result.get("success"):
            result["transcript"] = transcript
            
        return result

    except Exception as e:
        logger.error(f"VLM Exception: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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
