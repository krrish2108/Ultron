from dotenv import load_dotenv
import os

load_dotenv()

class db_Settings():
    URL = os.getenv("DATABASE_URL")
