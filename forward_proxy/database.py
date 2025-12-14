from sqlalchemy import create_engine, Column, Integer, String, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
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

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
