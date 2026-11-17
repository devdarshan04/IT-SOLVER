import json
import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.models import IssueTicket, User, KnowledgeArticle, SystemSetting
from backend.app.schemas.schemas import (
    IssueResponse,
    IssueUpdate,
    DiagnosisResult,
    StepItem,
    SimilarIssueMatch
)
from backend.app.api.auth import get_current_user
from backend.app.services.gemini_service import analyze_error_with_gemini
from backend.app.services.similarity_service import find_similar_issues

router = APIRouter(prefix="/issues", tags=["Issues & Troubleshooting"])

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

@router.post("/analyze", response_model=DiagnosisResult)
async def analyze_problem(
    file: Optional[UploadFile] = File(None),
    description: str = Form(""),
    os_platform: str = Form("Windows"),
    category_hint: str = Form("Auto-Detect"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Directly analyzes an uploaded screenshot and/or error description with Gemini AI.
    Returns structured troubleshooting roadmap + detected similar issues.
    """
    image_path = None
    if file:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Please upload JPG, PNG, or WEBP."
            )
        
        file_ext = os.path.splitext(file.filename)[1] or ".png"
        unique_filename = f"temp_{uuid.uuid4().hex}{file_ext}"
        image_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        content = await file.read()
        with open(image_path, "wb") as out_file:
            out_file.write(content)

    # Check for custom DB Gemini API Key
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
    custom_key = db_setting.value if db_setting else None

    # Call Gemini AI
    diagnosis = await analyze_error_with_gemini(
        image_path=image_path,
        description=description,
        os_platform=os_platform,
        category_hint=category_hint,
        runtime_api_key=custom_key
    )

    # Find Similar Solved Issues in Knowledge Base and Past Tickets
    similar = find_similar_issues(
        title=diagnosis.get("title", ""),
        error_code=diagnosis.get("detected_error_code", ""),
        category=diagnosis.get("category", ""),
        description=description,
        db=db,
        limit=3
    )

    # Convert steps
    step_items = []
    for s in diagnosis.get("steps", []):
        step_items.append(StepItem(
            step_number=s.get("step_number", 1),
            title=s.get("title", "Resolution Step"),
            action=s.get("action", ""),
            command=s.get("command"),
            explanation=s.get("explanation"),
            caution=s.get("caution")
        ))

    return DiagnosisResult(
        title=diagnosis.get("title", "IT Diagnostic Analysis"),
        detected_error_code=diagnosis.get("detected_error_code"),
        category=diagnosis.get("category", "General IT"),
        severity=diagnosis.get("severity", "Medium"),
        root_cause=diagnosis.get("root_cause", ""),
        steps=step_items,
        verification_command=diagnosis.get("verification_command"),
        preventive_tips=diagnosis.get("preventive_tips"),
        confidence_score=diagnosis.get("confidence_score", 95.0),
        similar_issues=similar
    )


@router.post("/", response_model=IssueResponse)
async def create_issue_ticket(
    file: Optional[UploadFile] = File(None),
    description: str = Form(""),
    title: Optional[str] = Form(None),
    os_platform: str = Form("Windows"),
    category_hint: str = Form("Auto-Detect"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits an error screenshot and creates a persistent Issue Ticket with AI analysis.
    """
    screenshot_url = None
    image_path = None
    
    if file:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}."
            )
        
        file_ext = os.path.splitext(file.filename)[1] or ".png"
        saved_filename = f"{uuid.uuid4().hex}{file_ext}"
        image_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
        
        content = await file.read()
        with open(image_path, "wb") as out_file:
            out_file.write(content)
            
        screenshot_url = f"/uploads/{saved_filename}"

    # Check for custom DB Gemini API Key
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
    custom_key = db_setting.value if db_setting else None

    # Run AI Analysis
    diagnosis = await analyze_error_with_gemini(
        image_path=image_path,
        description=description,
        os_platform=os_platform,
        category_hint=category_hint,
        runtime_api_key=custom_key
    )

    issue_title = title if (title and title.strip()) else diagnosis.get("title", "System Error Resolution")
    steps_serialized = json.dumps(diagnosis.get("steps", []))

    ticket = IssueTicket(
        user_id=current_user.id,
        title=issue_title,
        description=description,
        screenshot_url=screenshot_url,
        detected_error_code=diagnosis.get("detected_error_code"),
        category=diagnosis.get("category", "General IT"),
        severity=diagnosis.get("severity", "Medium"),
        status="open",
        ai_diagnosis=diagnosis.get("root_cause", ""),
        ai_steps=steps_serialized,
        verification_command=diagnosis.get("verification_command"),
        root_cause=diagnosis.get("root_cause", ""),
        confidence_score=diagnosis.get("confidence_score", 95.0)
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return IssueResponse.model_validate(ticket)


@router.get("/", response_model=List[IssueResponse])
def get_user_issues(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    all_users: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns user problem-solving history or all tickets if admin requests.
    """
    query = db.query(IssueTicket)
    
    # If not admin or all_users is false, filter by current user
    if current_user.role != "admin" or not all_users:
        query = query.filter(IssueTicket.user_id == current_user.id)
        
    if status_filter:
        query = query.filter(IssueTicket.status == status_filter.lower())
    if category:
        query = query.filter(IssueTicket.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (IssueTicket.title.ilike(s)) | 
            (IssueTicket.detected_error_code.ilike(s)) |
            (IssueTicket.description.ilike(s))
        )
        
    tickets = query.order_by(IssueTicket.created_at.desc()).all()
    return [IssueResponse.model_validate(t) for t in tickets]


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue_by_id(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(IssueTicket).filter(IssueTicket.id == issue_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Issue ticket not found")
        
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this ticket")
        
    return IssueResponse.model_validate(ticket)


@router.patch("/{issue_id}", response_model=IssueResponse)
def update_issue_ticket(
    issue_id: int,
    update_data: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(IssueTicket).filter(IssueTicket.id == issue_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Issue ticket not found")
        
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this ticket")
        
    if update_data.status is not None:
        ticket.status = update_data.status
    if update_data.resolution_notes is not None:
        ticket.resolution_notes = update_data.resolution_notes
    if update_data.rating is not None:
        ticket.rating = max(1, min(5, update_data.rating))
    if update_data.is_public_kb is not None:
        ticket.is_public_kb = update_data.is_public_kb

    db.commit()
    db.refresh(ticket)
    return IssueResponse.model_validate(ticket)


@router.post("/{issue_id}/publish-to-kb")
def publish_ticket_to_knowledge_base(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publishes a solved ticket to the community Knowledge Base."""
    ticket = db.query(IssueTicket).filter(IssueTicket.id == issue_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Issue ticket not found")

    article = KnowledgeArticle(
        title=f"[Solved] {ticket.title}",
        problem_summary=ticket.description or ticket.title,
        symptoms=f"Error Code: {ticket.detected_error_code or 'N/A'}",
        root_cause=ticket.root_cause or ticket.ai_diagnosis,
        steps_json=ticket.ai_steps or "[]",
        verification_command=ticket.verification_command,
        tags=f"{ticket.category.lower()},community-fix,{ticket.detected_error_code or ''}",
        category=ticket.category,
        os_platform="Multi-Platform",
        source_ticket_id=ticket.id,
        created_by=f"FixTrail User #{current_user.id}"
    )
    ticket.is_public_kb = True
    db.add(article)
    db.commit()
    db.refresh(article)
    return {"message": "Successfully published to Knowledge Base", "article_id": article.id}


@router.delete("/{issue_id}")
def delete_issue_ticket(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(IssueTicket).filter(IssueTicket.id == issue_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Issue ticket not found")
        
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")
        
    db.delete(ticket)
    db.commit()
    return {"message": "Issue ticket deleted successfully"}
