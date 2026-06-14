from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
import datetime

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    sessions = relationship("ExerciseSession", back_populates="owner")

class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_type = Column(String, index=True) # e.g. "squat", "pushup"
    reps = Column(Integer, default=0)
    quality_score = Column(Float, default=0.0)
    duration = Column(Float, default=0.0) # in seconds
    average_rom = Column(Float, default=0.0)
    average_balance = Column(Float, default=0.0)
    risk_flags = Column(JSON, default=list)
    exercise_version = Column(String, default="v1.0")
    replay_data = Column(JSON, default=list) # Store skeleton coords
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="sessions")
