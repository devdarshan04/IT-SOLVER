import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user") # "user" or "admin"
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    issues = relationship("IssueTicket", back_populates="user", cascade="all, delete-orphan")


class IssueTicket(Base):
    __tablename__ = "issue_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    screenshot_url = Column(String(500), nullable=True)
    detected_error_code = Column(String(100), nullable=True, index=True)
    
    category = Column(String(100), default="General IT", index=True) # "Networking", "DevOps", "Database", "Operating System", "Frontend", "Backend"
    severity = Column(String(50), default="Medium") # "Low", "Medium", "High", "Critical"
    status = Column(String(50), default="open", index=True) # "open", "in_progress", "solved", "closed"
    
    # AI Troubleshooting results
    ai_diagnosis = Column(Text, nullable=True)
    ai_steps = Column(Text, nullable=True) # JSON serialized list of steps
    verification_command = Column(String(500), nullable=True)
    root_cause = Column(Text, nullable=True)
    confidence_score = Column(Float, default=95.0)
    
    # Resolution & Feedback
    resolution_notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True) # 1 to 5
    is_public_kb = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="issues")


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    problem_summary = Column(Text, nullable=False)
    symptoms = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    steps_json = Column(Text, nullable=False) # JSON serialized steps with commands
    verification_command = Column(String(500), nullable=True)
    
    tags = Column(String(255), nullable=True) # comma separated e.g. "docker,linux,containers"
    category = Column(String(100), default="General IT", index=True)
    os_platform = Column(String(100), default="All Platforms") # "Windows", "Linux", "macOS", "Web/Browser"
    
    upvotes = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    source_ticket_id = Column(Integer, nullable=True)
    created_by = Column(String(100), default="FixTrail AI Team")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
