import json
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import KnowledgeArticle, IssueTicket
from backend.app.schemas.schemas import SimilarIssueMatch

def tokenize(text: str) -> set:
    """Normalize and tokenize text into words."""
    if not text:
        return set()
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    words = [w for w in cleaned.split() if len(w) > 2]
    return set(words)

def compute_similarity(tokens_a: set, tokens_b: set) -> float:
    """Computes Jaccard/Dice-like word similarity coefficient."""
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    if not intersection:
        return 0.0
    score = (2.0 * len(intersection)) / (len(tokens_a) + len(tokens_b))
    return round(score * 100.0, 1)

def find_similar_issues(
    title: str,
    error_code: str,
    category: str,
    description: str,
    db: Session,
    current_issue_id: int = None,
    limit: int = 4
) -> List[SimilarIssueMatch]:
    """
    Scans the Knowledge Base and previously solved user tickets to detect matching issues.
    Returns ranked similar issues with similarity scores.
    """
    target_text = f"{title} {error_code or ''} {category or ''} {description or ''}"
    target_tokens = tokenize(target_text)
    
    matches: List[Dict[str, Any]] = []

    # 1. Search in Knowledge Base
    kb_articles = db.query(KnowledgeArticle).all()
    for art in kb_articles:
        kb_text = f"{art.title} {art.problem_summary} {art.symptoms or ''} {art.tags or ''} {art.category}"
        kb_tokens = tokenize(kb_text)
        sim = compute_similarity(target_tokens, kb_tokens)
        
        # Boost if category or error code directly matches
        if error_code and error_code.lower() in kb_text.lower():
            sim = min(100.0, sim + 30.0)
        elif art.category and category and art.category.lower() == category.lower():
            sim = min(98.0, sim + 15.0)
            
        if sim >= 30.0:
            # Extract first step action as quick fix preview
            quick_fix = art.problem_summary
            try:
                steps = json.loads(art.steps_json)
                if steps and isinstance(steps, list) and len(steps) > 0:
                    quick_fix = steps[0].get("action", art.problem_summary)
            except Exception:
                pass

            matches.append({
                "id": art.id,
                "title": art.title,
                "category": art.category,
                "similarity_score": sim,
                "quick_fix": quick_fix[:180] + ("..." if len(quick_fix) > 180 else ""),
                "is_kb": True
            })

    # 2. Search in Solved Issue Tickets
    query = db.query(IssueTicket).filter(IssueTicket.status == "solved")
    if current_issue_id:
        query = query.filter(IssueTicket.id != current_issue_id)
        
    solved_tickets = query.limit(50).all()
    for ticket in solved_tickets:
        ticket_text = f"{ticket.title} {ticket.detected_error_code or ''} {ticket.category} {ticket.description or ''}"
        ticket_tokens = tokenize(ticket_text)
        sim = compute_similarity(target_tokens, ticket_tokens)
        
        if error_code and ticket.detected_error_code and error_code.lower() == ticket.detected_error_code.lower():
            sim = min(99.0, sim + 35.0)
        elif ticket.category and category and ticket.category.lower() == category.lower():
            sim = min(95.0, sim + 15.0)
            
        if sim >= 35.0:
            quick_fix = ticket.root_cause or ticket.ai_diagnosis or "See previous resolution steps."
            matches.append({
                "id": ticket.id,
                "title": ticket.title,
                "category": ticket.category,
                "similarity_score": sim,
                "quick_fix": quick_fix[:180] + ("..." if len(quick_fix) > 180 else ""),
                "is_kb": False
            })

    # Sort descending by similarity score
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Return formatted schema objects
    result = []
    for m in matches[:limit]:
        result.append(SimilarIssueMatch(
            id=m["id"],
            title=m["title"],
            category=m["category"],
            similarity_score=m["similarity_score"],
            quick_fix=m["quick_fix"],
            is_kb=m["is_kb"]
        ))
        
    return result
