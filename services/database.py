from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base,sessionmaker
from config import db_Settings

engine = create_engine(url = str(db_Settings.URL))
SessionLocal = sessionmaker(bind = engine, autoflush = False)
class Base(declarative_base):
    pass