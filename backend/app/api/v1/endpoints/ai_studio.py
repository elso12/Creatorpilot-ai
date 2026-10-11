from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.idea import ContentIdea
from app.models.video import Video
from app.schemas.ai import (
    ContentPackRequest,
    ContentPackResponse,
    ResearchReportRequest,
    ResearchReportResponse,
    SaveIdeaRequest,
    SaveIdeaResponse,
)
from app.services.ai_client import AIStudioClient

router = APIRouter()


def _format_video_records(videos: List[Video]) -> List[Dict[str, Any]]:
    formatted = []
    for v in videos:
        chan_title = v.channel.title if v.channel else "Unknown Creator"
        formatted.append(
            {
                "id": v.id,
                "youtube_video_id": v.youtube_video_id,
                "title": v.title,
                "view_count": v.view_count,
                "like_count": v.like_count,
                "comment_count": v.comment_count,
                "channel_title": chan_title,
                "youtube_url": f"https://www.youtube.com/watch?v={v.youtube_video_id}",
            }
        )
    return formatted


@router.post(
    "/content-pack",
    response_model=ContentPackResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate full YouTube Content Pack",
    description="Synthesizes angles, titles, hooks, outline, and thumbnail briefs grounded in evidence data.",
)
async def generate_content_pack_endpoint(
    payload: ContentPackRequest,
    db: Session = Depends(get_db),
):
    grounded_videos: List[Dict[str, Any]] = []

    if payload.referenced_video_ids:
        stmt = (
            select(Video)
            .where(Video.id.in_(payload.referenced_video_ids))
            .options(selectinload(Video.channel))
        )
        video_objs = db.scalars(stmt).all()
        grounded_videos = _format_video_records(video_objs)

    client = AIStudioClient()
    return await client.generate_content_pack(
        request=payload, grounded_videos=grounded_videos
    )


@router.post(
    "/research-report",
    response_model=ResearchReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize empirical research intelligence report",
    description="Analyzes market patterns, content gaps, risks, and structured experiments from video datasets.",
)
async def generate_research_report_endpoint(
    payload: ResearchReportRequest,
    db: Session = Depends(get_db),
):
    grounded_videos: List[Dict[str, Any]] = []

    if payload.video_ids:
        stmt = (
            select(Video)
            .where(Video.id.in_(payload.video_ids))
            .options(selectinload(Video.channel))
        )
        video_objs = db.scalars(stmt).all()
        grounded_videos = _format_video_records(video_objs)
    else:
        # Fallback to recent top videos in database if none explicitly selected
        stmt = (
            select(Video)
            .order_by(Video.view_count.desc())
            .limit(12)
            .options(selectinload(Video.channel))
        )
        video_objs = db.scalars(stmt).all()
        if video_objs:
            grounded_videos = _format_video_records(video_objs)

    client = AIStudioClient()
    return await client.generate_research_report(
        request=payload, grounded_videos=grounded_videos
    )


@router.post(
    "/save-idea",
    response_model=SaveIdeaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save generated concept to content ideas pipeline",
    description="Persists AI-generated concept into the content_ideas table.",
)
def save_idea_endpoint(
    payload: SaveIdeaRequest,
    db: Session = Depends(get_db),
):
    idea = ContentIdea(
        title=payload.title,
        hook=payload.hook,
        script_outline=payload.script_outline,
        target_audience=payload.target_audience,
        format=payload.format,
        status=payload.status or "Idea",
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)

    return SaveIdeaResponse(
        id=idea.id,
        title=idea.title,
        hook=idea.hook,
        script_outline=idea.script_outline,
        target_audience=idea.target_audience,
        format=idea.format,
        status=idea.status,
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


@router.get(
    "/ideas",
    response_model=List[SaveIdeaResponse],
    summary="List saved content ideas",
    description="Retrieves all content ideas saved from AI Studio or Planner.",
)
def list_ideas_endpoint(
    db: Session = Depends(get_db),
):
    stmt = select(ContentIdea).order_by(ContentIdea.created_at.desc())
    ideas = db.scalars(stmt).all()
    return [
        SaveIdeaResponse(
            id=i.id,
            title=i.title,
            hook=i.hook,
            script_outline=i.script_outline,
            target_audience=i.target_audience,
            format=i.format,
            status=i.status,
            created_at=i.created_at,
            updated_at=i.updated_at,
        )
        for i in ideas
    ]
