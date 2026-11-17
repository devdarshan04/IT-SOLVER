from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import KnowledgeArticle, User
from backend.app.schemas.schemas import KnowledgeArticleCreate, KnowledgeArticleResponse
from backend.app.api.auth import get_current_user, get_admin_user

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

@router.get("/", response_model=List[KnowledgeArticleResponse])
def get_articles(
    search: Optional[str] = None,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    sort_by: str = Query("popular", pattern="^(popular|newest|helpful)$"),
    db: Session = Depends(get_db)
):
    """Lists knowledge base articles with full search and filtering."""
    query = db.query(KnowledgeArticle)
    
    if search:
        s = f"%{search}%"
        query = query.filter(
            (KnowledgeArticle.title.ilike(s)) |
            (KnowledgeArticle.problem_summary.ilike(s)) |
            (KnowledgeArticle.root_cause.ilike(s)) |
            (KnowledgeArticle.tags.ilike(s))
        )
    if category and category != "All":
        query = query.filter(KnowledgeArticle.category == category)
    if platform and platform != "All":
        query = query.filter(
            (KnowledgeArticle.os_platform == platform) |
            (KnowledgeArticle.os_platform == "All Platforms") |
            (KnowledgeArticle.os_platform == "Multi-Platform")
        )
        
    if sort_by == "newest":
        query = query.order_by(KnowledgeArticle.created_at.desc())
    elif sort_by == "helpful":
        query = query.order_by(KnowledgeArticle.helpful_count.desc())
    else: # popular
        query = query.order_by(KnowledgeArticle.views_count.desc(), KnowledgeArticle.helpful_count.desc())
        
    articles = query.all()
    return [KnowledgeArticleResponse.model_validate(a) for a in articles]


@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge base article not found")
        
    article.views_count = (article.views_count or 0) + 1
    db.commit()
    db.refresh(article)
    return KnowledgeArticleResponse.model_validate(article)


@router.post("/{article_id}/helpful")
def mark_helpful(article_id: int, db: Session = Depends(get_db)):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge base article not found")
        
    article.helpful_count = (article.helpful_count or 0) + 1
    article.upvotes = (article.upvotes or 0) + 1
    db.commit()
    return {"message": "Marked as helpful", "helpful_count": article.helpful_count}


@router.post("/", response_model=KnowledgeArticleResponse)
def create_article(
    article_in: KnowledgeArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    article = KnowledgeArticle(
        title=article_in.title,
        problem_summary=article_in.problem_summary,
        symptoms=article_in.symptoms,
        root_cause=article_in.root_cause,
        steps_json=article_in.steps_json,
        verification_command=article_in.verification_command,
        tags=article_in.tags,
        category=article_in.category or "General IT",
        os_platform=article_in.os_platform or "All Platforms",
        created_by=current_user.full_name
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return KnowledgeArticleResponse.model_validate(article)


@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge base article not found")
        
    db.delete(article)
    db.commit()
    return {"message": "Knowledge article deleted successfully"}
