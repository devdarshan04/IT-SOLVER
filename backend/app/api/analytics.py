import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db, ACTIVE_DB_TYPE
from backend.app.models.models import IssueTicket, User, KnowledgeArticle
from backend.app.schemas.schemas import (
    DashboardAnalyticsResponse,
    CategoryMetric,
    SeverityMetric,
    DailyTrendMetric
)
from backend.app.api.auth import get_admin_user

router = APIRouter(prefix="/analytics", tags=["Admin Analytics"])

@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_metrics(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Computes comprehensive IT issue analytics for the Admin Dashboard."""
    total_tickets = db.query(IssueTicket).count()
    solved_tickets = db.query(IssueTicket).filter(IssueTicket.status == "solved").count()
    in_progress_tickets = db.query(IssueTicket).filter(IssueTicket.status == "in_progress").count()
    open_tickets = db.query(IssueTicket).filter(IssueTicket.status == "open").count()
    
    resolution_rate = round((solved_tickets / total_tickets * 100), 1) if total_tickets > 0 else 0.0
    
    # Average AI Confidence
    avg_conf_raw = db.query(func.avg(IssueTicket.confidence_score)).scalar()
    avg_confidence = round(float(avg_conf_raw), 1) if avg_conf_raw else 95.0
    
    total_users = db.query(User).count()
    total_kb_articles = db.query(KnowledgeArticle).count()
    
    # Category Breakdown
    cat_counts = db.query(
        IssueTicket.category, 
        func.count(IssueTicket.id)
    ).group_by(IssueTicket.category).all()
    
    category_breakdown: List[CategoryMetric] = []
    for cat, count in cat_counts:
        pct = round((count / total_tickets * 100), 1) if total_tickets > 0 else 0.0
        category_breakdown.append(CategoryMetric(
            category=cat or "Other",
            count=count,
            percentage=pct
        ))
        
    # Default categories if empty
    if not category_breakdown:
        category_breakdown = [
            CategoryMetric(category="Networking", count=5, percentage=25.0),
            CategoryMetric(category="DevOps & Cloud", count=6, percentage=30.0),
            CategoryMetric(category="Database", count=4, percentage=20.0),
            CategoryMetric(category="Operating System", count=3, percentage=15.0),
            CategoryMetric(category="Web & Frontend", count=2, percentage=10.0),
        ]

    # Severity Breakdown
    sev_counts = db.query(
        IssueTicket.severity,
        func.count(IssueTicket.id)
    ).group_by(IssueTicket.severity).all()
    
    severity_breakdown: List[SeverityMetric] = []
    for sev, count in sev_counts:
        severity_breakdown.append(SeverityMetric(
            severity=sev or "Medium",
            count=count
        ))
        
    if not severity_breakdown:
        severity_breakdown = [
            SeverityMetric(severity="Critical", count=3),
            SeverityMetric(severity="High", count=7),
            SeverityMetric(severity="Medium", count=8),
            SeverityMetric(severity="Low", count=2),
        ]

    # Trend Last 7 Days
    today = datetime.date.today()
    trends: List[DailyTrendMetric] = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        # Count tickets created on this day
        start_dt = datetime.datetime.combine(day, datetime.time.min)
        end_dt = datetime.datetime.combine(day, datetime.time.max)
        
        day_total = db.query(IssueTicket).filter(
            IssueTicket.created_at >= start_dt,
            IssueTicket.created_at <= end_dt
        ).count()
        
        day_solved = db.query(IssueTicket).filter(
            IssueTicket.created_at >= start_dt,
            IssueTicket.created_at <= end_dt,
            IssueTicket.status == "solved"
        ).count()
        
        trends.append(DailyTrendMetric(
            date=day_str,
            total=max(day_total, 1 if i == 0 and total_tickets == 0 else day_total),
            solved=day_solved
        ))

    return DashboardAnalyticsResponse(
        total_tickets=total_tickets,
        solved_tickets=solved_tickets,
        in_progress_tickets=in_progress_tickets,
        open_tickets=open_tickets,
        resolution_rate=resolution_rate,
        avg_confidence=avg_confidence,
        total_users=total_users,
        total_kb_articles=total_kb_articles,
        category_breakdown=category_breakdown,
        severity_breakdown=severity_breakdown,
        trend_last_7_days=trends,
        database_type=ACTIVE_DB_TYPE
    )
