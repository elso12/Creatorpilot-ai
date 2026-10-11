from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.idea import ContentIdea
from app.schemas.planner import CreateIdeaRequest, IdeaResponse, UpdateIdeaRequest

router = APIRouter()


@router.get(
    "/ideas",
    response_model=List[IdeaResponse],
    summary="List planner content ideas with filters",
    description="Retrieve content ideas filtered by status, format, favorite flag, or search query.",
)
def get_planner_ideas(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    format_filter: Optional[str] = Query(None, alias="format", description="Filter by format"),
    is_favorite: Optional[bool] = Query(None, description="Filter by favorite flag"),
    search: Optional[str] = Query(None, description="Search across title, hook, and outline"),
    db: Session = Depends(get_db),
):
    stmt = select(ContentIdea).order_by(
        ContentIdea.is_favorite.desc(), ContentIdea.updated_at.desc()
    )

    if status_filter:
        stmt = stmt.where(ContentIdea.status == status_filter)

    if format_filter:
        stmt = stmt.where(ContentIdea.format == format_filter)

    if is_favorite is not None:
        stmt = stmt.where(ContentIdea.is_favorite == is_favorite)

    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            (ContentIdea.title.ilike(pattern))
            | (ContentIdea.hook.ilike(pattern))
            | (ContentIdea.target_audience.ilike(pattern))
        )

    ideas = db.scalars(stmt).all()
    return ideas


@router.post(
    "/ideas",
    response_model=IdeaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new content idea",
    description="Manually create a video idea with initial stage, format, and optional notes.",
)
def create_planner_idea(
    payload: CreateIdeaRequest,
    db: Session = Depends(get_db),
):
    idea = ContentIdea(
        title=payload.title,
        hook=payload.hook,
        script_outline=payload.script_outline,
        target_audience=payload.target_audience,
        research_notes=payload.research_notes,
        format=payload.format,
        status=payload.status or "Idea",
        is_favorite=payload.is_favorite,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea


@router.patch(
    "/ideas/{idea_id}",
    response_model=IdeaResponse,
    summary="Update content idea details or stage",
    description="Update an idea's workflow status, title, hook, outline notes, or favorite flag.",
)
def update_planner_idea(
    idea_id: int,
    payload: UpdateIdeaRequest,
    db: Session = Depends(get_db),
):
    idea = db.scalars(
        select(ContentIdea).where(ContentIdea.id == idea_id)
    ).first()

    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content idea with ID {idea_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(idea, field, val)

    db.commit()
    db.refresh(idea)
    return idea


@router.delete(
    "/ideas/{idea_id}",
    summary="Delete content idea",
    description="Permanently removes an idea from the planning board.",
)
def delete_planner_idea(
    idea_id: int,
    db: Session = Depends(get_db),
):
    idea = db.scalars(
        select(ContentIdea).where(ContentIdea.id == idea_id)
    ).first()

    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content idea with ID {idea_id} not found",
        )

    title = idea.title
    db.delete(idea)
    db.commit()

    return {
        "status": "deleted",
        "id": idea_id,
        "title": title,
        "message": f"Successfully deleted idea '{title}'",
    }
