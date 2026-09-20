from pydantic import BaseModel, EmailStr
from typing import Optional


class pyd_login(BaseModel):
    email: EmailStr
    password: str


class pyd_register(BaseModel):
    user_name: str
    email: EmailStr
    password: str
    Role: str = "user"  # Defaults to 'user' if not specified


class ChatCreate(BaseModel):
    Chat_name: str
    User_Id: str  # Updated from int to str to match model
    Human_message: str
    AI_message: Optional[str] = None
    Upload_Doc: Optional[str] = None
