from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True
        from_attributes = True

# Exercise Session Schemas
class SessionBase(BaseModel):
    exercise_type: str
    reps: int
    quality_score: float
    duration: float
    average_rom: float = 0.0
    average_balance: float = 0.0
    risk_flags: List[str] = []
    exercise_version: str = "v1.0"

class SessionCreate(SessionBase):
    replay_data: List[dict] = []

class SessionResponse(SessionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
