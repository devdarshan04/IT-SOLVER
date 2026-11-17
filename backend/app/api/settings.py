import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, ACTIVE_DB_TYPE
from backend.app.core.config import settings
from backend.app.models.models import SystemSetting, User
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/system", tags=["System & Settings"])

class ApiKeyUpdate(BaseModel):
    gemini_api_key: str
    gemini_model: Optional[str] = "gemini-1.5-flash"

class SystemStatusResponse(BaseModel):
    status: str
    app_name: str
    database: str
    has_gemini_key: bool
    masked_key: Optional[str] = None
    gemini_model: str

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status(db: Session = Depends(get_db)):
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
    active_key = db_setting.value if db_setting and db_setting.value else settings.GEMINI_API_KEY
    
    has_key = bool(active_key and active_key.strip())
    masked = None
    if has_key:
        clean = active_key.strip()
        masked = f"{clean[:4]}...{clean[-4:]}" if len(clean) > 8 else "***"
        
    return SystemStatusResponse(
        status="operational",
        app_name=settings.PROJECT_NAME,
        database=ACTIVE_DB_TYPE,
        has_gemini_key=has_key,
        masked_key=masked,
        gemini_model=settings.GEMINI_MODEL
    )

@router.post("/set-key")
def update_gemini_key(
    payload: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user-provided Gemini API key in system settings."""
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
    if not db_setting:
        db_setting = SystemSetting(key="gemini_api_key", value=payload.gemini_api_key.strip())
        db.add(db_setting)
    else:
        db_setting.value = payload.gemini_api_key.strip()
        
    db.commit()
    return {"message": "Gemini API key updated successfully", "has_key": bool(payload.gemini_api_key.strip())}
