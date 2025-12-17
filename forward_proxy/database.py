from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import date

import os

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

SQLALCHEMY_DATABASE_URL = "sqlite:///./data/users.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    quota_count = Column(Integer, default=0)
    last_reset_date = Column(Date, default=date.today)

    # Profile fields
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Integer, nullable=True)
    activity_level = Column(String, nullable=True)
    medical_condition = Column(String, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    motivation = Column(String, nullable=True)
    
    # Weight goal tracking
    target_weight_kg = Column(Integer, nullable=True)
    weight_goal_type = Column(String, nullable=True)
    weight_loss_rate = Column(String, nullable=True)
    target_date = Column(Date, nullable=True)
    
    # Body composition
    body_fat_percentage = Column(Integer, nullable=True)
    
    # Dietary preferences
    protein_preference = Column(String, nullable=True)

    # Custom goal overrides
    custom_calories = Column(Integer, nullable=True)
    custom_protein = Column(Integer, nullable=True)
    custom_carbs = Column(Integer, nullable=True)
    custom_fat = Column(Integer, nullable=True)
    is_custom_goals = Column(Integer, nullable=True) # 0 or 1
    
    # Profile Image
    profile_image_path = Column(String, nullable=True)

    meals = relationship("Meal", back_populates="user")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(Integer)
    category = Column(String)
    image_path = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    transcription = Column(String, nullable=True)
    
    # Nutrition Info
    calories = Column(Integer)
    carbs = Column(Integer)
    sugar = Column(Integer)
    protein = Column(Integer)
    fat = Column(Integer)
    
    # Meal Quality
    calorie_density = Column(Float)
    goal_fit_percentage = Column(Float)
    meal_quality_score = Column(Float)

    user = relationship("User", back_populates="meals")

def init_db():
    Base.metadata.create_all(bind=engine)

    # Lightweight migrations for sqlite (add new columns when missing)
    # NOTE: For larger projects, use Alembic.
    with engine.connect() as conn:
        try:
            cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(meals)").fetchall()]
            if "audio_path" not in cols:
                conn.exec_driver_sql("ALTER TABLE meals ADD COLUMN audio_path VARCHAR")
        except Exception:
            # meals table may not exist yet or PRAGMA may fail in edge cases
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
