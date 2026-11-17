from typing import Optional, List, Any
import datetime
from pydantic import BaseModel

# Auth Schemas
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Step Schema
class StepItem(BaseModel):
    step_number: int
    title: str
    action: str
    command: Optional[str] = None
    explanation: Optional[str] = None
    caution: Optional[str] = None

# Similar Issue Match
class SimilarIssueMatch(BaseModel):
    id: int
    title: str
    category: str
    similarity_score: float # percentage e.g. 92.5
    quick_fix: Optional[str] = None
    is_kb: bool = False

# AI Diagnosis Output
class DiagnosisResult(BaseModel):
    title: str
    detected_error_code: Optional[str] = None
    category: str
    severity: str
    root_cause: str
    steps: List[StepItem]
    verification_command: Optional[str] = None
    preventive_tips: Optional[str] = None
    confidence_score: float = 95.0
    similar_issues: List[SimilarIssueMatch] = []

# Issue Ticket Schemas
class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "General IT"
    severity: Optional[str] = "Medium"

class IssueUpdate(BaseModel):
    status: Optional[str] = None # "open", "in_progress", "solved", "closed"
    resolution_notes: Optional[str] = None
    rating: Optional[int] = None
    is_public_kb: Optional[bool] = None

class IssueResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    screenshot_url: Optional[str] = None
    detected_error_code: Optional[str] = None
    category: str
    severity: str
    status: str
    ai_diagnosis: Optional[str] = None
    ai_steps: Optional[str] = None # JSON string
    verification_command: Optional[str] = None
    root_cause: Optional[str] = None
    confidence_score: Optional[float] = 95.0
    resolution_notes: Optional[str] = None
    rating: Optional[int] = None
    is_public_kb: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Knowledge Base Schemas
class KnowledgeArticleCreate(BaseModel):
    title: str
    problem_summary: str
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    steps_json: str
    verification_command: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = "General IT"
    os_platform: Optional[str] = "All Platforms"

class KnowledgeArticleResponse(BaseModel):
    id: int
    title: str
    problem_summary: str
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    steps_json: str
    verification_command: Optional[str] = None
    tags: Optional[str] = None
    category: str
    os_platform: str
    upvotes: int
    helpful_count: int
    views_count: int
    created_by: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Admin Analytics Schemas
class CategoryMetric(BaseModel):
    category: str
    count: int
    percentage: float

class SeverityMetric(BaseModel):
    severity: str
    count: int

class DailyTrendMetric(BaseModel):
    date: str
    total: int
    solved: int

class DashboardAnalyticsResponse(BaseModel):
    total_tickets: int
    solved_tickets: int
    in_progress_tickets: int
    open_tickets: int
    resolution_rate: float
    avg_confidence: float
    total_users: int
    total_kb_articles: int
    category_breakdown: List[CategoryMetric]
    severity_breakdown: List[SeverityMetric]
    trend_last_7_days: List[DailyTrendMetric]
    database_type: str
