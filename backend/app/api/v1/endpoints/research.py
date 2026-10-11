from datetime import datetime
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.database import get_db
from app.core.utils import format_duration_seconds
from app.models.channel import Channel
from app.models.snapshot import VideoSnapshot
from app.models.video import Video
from app.schemas.research import (
    SaveVideoRequest,
    SavedVideoResponseSchema,
    SearchResponseSchema,
)
from app.services.youtube_client import YouTubeClient

router = APIRouter()


@router.get(
    "/search",
    response_model=SearchResponseSchema,
    summary="Search YouTube videos",
    description="Search for YouTube videos by keyword with filters. Falls back to mock data if API key is not configured.",
)
async def search_youtube_videos(
    q: str = Query(..., min_length=1, description="Search query keyword"),
    max_results: int = Query(
        default=20, ge=1, le=50, description="Max results (1-50)"
    ),
    order: Literal[
        "date", "rating", "relevance", "title", "videoCount", "viewCount"
    ] = Query(default="relevance", description="Sort order"),
    published_after: Optional[datetime] = Query(
        default=None, description="Filter videos published after this UTC timestamp"
    ),
    duration_filter: Literal["all", "short", "medium", "long"] = Query(
        default="all", description="Filter duration: all, short (<4m), medium (4-20m), long (>20m)"
    ),
):
    client = YouTubeClient()
    return await client.search_videos(
        q=q,
        max_results=max_results,
        order=order,
        published_after=published_after,
        duration_filter=duration_filter,
    )


@router.post(
    "/save",
    response_model=SavedVideoResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Save researched video to database",
    description="Upserts the channel record, creates or updates the video record, and records an initial snapshot.",
)
def save_research_video(
    payload: SaveVideoRequest,
    db: Session = Depends(get_db),
):
    # 1. Upsert Channel
    channel_stmt = select(Channel).where(
        Channel.youtube_channel_id == payload.channel_youtube_id
    )
    channel = db.scalars(channel_stmt).first()

    if not channel:
        channel = Channel(
            youtube_channel_id=payload.channel_youtube_id,
            title=payload.channel_title,
            thumbnail_url=payload.thumbnail_url,
        )
        db.add(channel)
        db.flush()
    else:
        channel.title = payload.channel_title
        if payload.thumbnail_url and not channel.thumbnail_url:
            channel.thumbnail_url = payload.thumbnail_url
        db.flush()

    # 2. Upsert Video
    video_stmt = select(Video).where(
        Video.youtube_video_id == payload.youtube_video_id
    )
    video = db.scalars(video_stmt).first()

    if not video:
        video = Video(
            youtube_video_id=payload.youtube_video_id,
            channel_id=channel.id,
            title=payload.title,
            description=payload.description,
            published_at=payload.published_at,
            duration_seconds=payload.duration_seconds,
            thumbnail_url=payload.thumbnail_url,
            view_count=payload.view_count,
            like_count=payload.like_count,
            comment_count=payload.comment_count,
        )
        db.add(video)
        db.flush()
    else:
        video.channel_id = channel.id
        video.title = payload.title
        video.description = payload.description
        video.published_at = payload.published_at
        video.duration_seconds = payload.duration_seconds
        video.thumbnail_url = payload.thumbnail_url
        video.view_count = payload.view_count
        video.like_count = payload.like_count
        video.comment_count = payload.comment_count
        db.flush()

    # 3. Create initial VideoSnapshot for tracking baseline
    snapshot = VideoSnapshot(
        video_id=video.id,
        view_count=payload.view_count,
        like_count=payload.like_count,
        comment_count=payload.comment_count,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(video)

    snapshot_count = len(video.snapshots)

    return SavedVideoResponseSchema(
        id=video.id,
        youtube_video_id=video.youtube_video_id,
        channel_id=video.channel_id,
        channel_youtube_id=channel.youtube_channel_id,
        channel_title=channel.title,
        title=video.title,
        description=video.description,
        published_at=video.published_at,
        duration_seconds=video.duration_seconds or 0,
        duration_formatted=format_duration_seconds(video.duration_seconds or 0),
        thumbnail_url=video.thumbnail_url,
        view_count=video.view_count,
        like_count=video.like_count,
        comment_count=video.comment_count,
        snapshot_count=snapshot_count,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )


@router.get(
    "/saved",
    response_model=List[SavedVideoResponseSchema],
    summary="Get all saved research videos",
    description="Returns all saved research videos from PostgreSQL with their associated channel titles and snapshot counts.",
)
def get_saved_research_videos(
    db: Session = Depends(get_db),
):
    stmt = (
        select(Video)
        .options(joinedload(Video.channel), selectinload(Video.snapshots))
        .order_by(Video.created_at.desc())
    )
    videos = db.scalars(stmt).all()

    results: List[SavedVideoResponseSchema] = []
    for v in videos:
        channel_title = v.channel.title if v.channel else None
        channel_youtube_id = v.channel.youtube_channel_id if v.channel else None
        results.append(
            SavedVideoResponseSchema(
                id=v.id,
                youtube_video_id=v.youtube_video_id,
                channel_id=v.channel_id,
                channel_youtube_id=channel_youtube_id,
                channel_title=channel_title,
                title=v.title,
                description=v.description,
                published_at=v.published_at,
                duration_seconds=v.duration_seconds or 0,
                duration_formatted=format_duration_seconds(v.duration_seconds or 0),
                thumbnail_url=v.thumbnail_url,
                view_count=v.view_count,
                like_count=v.like_count,
                comment_count=v.comment_count,
                snapshot_count=len(v.snapshots),
                created_at=v.created_at,
                updated_at=v.updated_at,
            )
        )
    return results
