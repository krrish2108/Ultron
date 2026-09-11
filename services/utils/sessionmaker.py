from contextlib import contextmanager
from database import SessionLocal

# 1. Used for FastAPI Route Dependencies (Depends(make_db_session))
def make_db_session():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# 2. Used for Context Managers in Background Tasks / Scripts (with get_db_session() as db:)
@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()