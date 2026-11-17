import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def get_engine():
    """
    Attempts to connect to MySQL database as configured.
    If MySQL server is unavailable or connection fails, falls back gracefully to SQLite
    to guarantee FixTrail remains fully functional without crashing.
    """
    if settings.DATABASE_URL and settings.DATABASE_URL.startswith("mysql"):
        try:
            logger.info(f"Attempting to connect to MySQL database at {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}...")
            mysql_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with mysql_engine.connect() as conn:
                logger.info("Successfully connected to MySQL database!")
                return mysql_engine, "MySQL"
        except Exception as e:
            logger.warning(f"Could not connect to MySQL ({e}). Falling back to local SQLite engine ({settings.SQLITE_FALLBACK_URL}) for seamless execution.")
            sqlite_engine = create_engine(
                settings.SQLITE_FALLBACK_URL,
                connect_args={"check_same_thread": False}
            )
            return sqlite_engine, "SQLite (Fallback)"
    else:
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine, "SQLite"

engine, ACTIVE_DB_TYPE = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
