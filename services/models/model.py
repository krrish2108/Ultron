from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Users(Base):
    __tablename__ = "Users"

    # Changed from Integer to String(50) (VARCHAR)
    User_ID: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    Role: Mapped[str] = mapped_column(String(20), nullable=False)


class Chat(Base):
    __tablename__ = "Chats"

    Chat_ID: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)
    Chat_name: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Changed from Integer to String(50) to match Users.User_ID
    User_Id: Mapped[str] = mapped_column(String(50), ForeignKey("Users.User_ID"), nullable=False)
    
    Human_message: Mapped[str] = mapped_column(String(1000), nullable=False)
    AI_message: Mapped[str] = mapped_column(String(1000), nullable=True)
    Upload_Doc: Mapped[str] = mapped_column(String(100), nullable=True)


class Enclaves(Base):
    __tablename__ = "Enclaves"

    Enclave_ID: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)
    Enclave_name: Mapped[str] = mapped_column(String(50), nullable=False)
    Type: Mapped[str] = mapped_column(String(50), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Assets(Base):
    __tablename__ = "Assets"

    Asset_ID: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)
    Asset_name: Mapped[str] = mapped_column(String(50), nullable=False)
    Size: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    Status: Mapped[str] = mapped_column(String(50), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=True)
    file_path: Mapped[str] = mapped_column(String(100), nullable=True)


class Reports(Base):
    __tablename__ = "reports"

    Report_ID: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)
    Chat_ID: Mapped[int] = mapped_column(Integer, ForeignKey("Chats.Chat_ID"), nullable=False)
    Report_name: Mapped[str] = mapped_column(String(50), nullable=False)
    output_file_path: Mapped[str] = mapped_column(String(100), nullable=True)
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )
