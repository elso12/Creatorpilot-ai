import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.utils import format_duration_seconds
from app.models.channel import Channel
from app.models.idea import ContentIdea
from app.models.video import Video
from app.services.scoring import calculate_opportunity_score

router = APIRouter()


def _mask_api_key(key: Optional[str]) -> Optional[str]:
    if not key or not key.strip():
        return None
    clean = key.strip()
    if len(clean) <= 8:
        return "********"
    return f"{clean[:4]}...{clean[-4:]}"


def _compute_median(values: List[int]) -> int:
    if not values:
        return 0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    if n % 2 == 1:
        return sorted_vals[n // 2]
    return int((sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2)


@router.get(
    "/overview",
    summary="Consolidated Executive Dashboard Metrics",
    description="Returns high-level statistics, top outlier alerts, pipeline counts, and system provider statuses.",
)
def get_dashboard_overview(
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Total saved research videos
    total_saved_videos = (
        db.scalar(select(func.count(Video.id))) or 0
    )

    # 2. Total tracked competitors
    total_tracked_competitors = (
        db.scalar(select(func.count(Channel.id)).where(Channel.is_competitor == True))
        or 0
    )

    # 3. Ideas in pipeline & count by status
    total_ideas = db.scalar(select(func.count(ContentIdea.id))) or 0

    all_ideas = db.scalars(select(ContentIdea)).all()
    ideas_by_status = {
        "Idea": 0,
        "Researching": 0,
        "Ready": 0,
        "Published": 0,
        "Reviewed": 0,
    }
    for idea in all_ideas:
        st = idea.status if idea.status in ideas_by_status else "Idea"
        ideas_by_status[st] = ideas_by_status.get(st, 0) + 1

    # 4. Top Opportunities (top 3 outliers from tracked competitors)
    comp_channels = db.scalars(
        select(Channel)
        .where(Channel.is_competitor == True)
        .options(selectinload(Channel.videos))
    ).all()

    all_scored_videos = []
    for chan in comp_channels:
        if not chan.videos:
            continue
        views_list = [v.view_count for v in chan.videos]
        chan_median = _compute_median(views_list)

        for v in chan.videos:
            score_data = calculate_opportunity_score(
                video_views=v.view_count,
                channel_median_views=chan_median,
                published_at=v.published_at,
                likes=v.like_count,
                comments=v.comment_count,
                subscriber_count=chan.subscriber_count,
            )
            all_scored_videos.append(
                {
                    "id": v.id,
                    "youtube_video_id": v.youtube_video_id,
                    "title": v.title,
                    "channel_title": chan.title,
                    "channel_id": chan.id,
                    "thumbnail_url": v.thumbnail_url,
                    "view_count": v.view_count,
                    "published_at": v.published_at,
                    "opportunity_score": score_data["opportunity_score"],
                    "performance_ratio": score_data["performance_ratio"],
                    "classification": score_data["classification"],
                    "views_per_day": score_data["views_per_day"],
                    "youtube_url": f"https://www.youtube.com/watch?v={v.youtube_video_id}",
                }
            )

    all_scored_videos.sort(key=lambda x: x["opportunity_score"], reverse=True)
    top_opportunities = all_scored_videos[:3]

    # 5. Recent saved research videos (latest 4)
    recent_videos_query = (
        select(Video)
        .order_by(Video.created_at.desc())
        .limit(4)
        .options(selectinload(Video.channel))
    )
    recent_video_objs = db.scalars(recent_videos_query).all()
    recent_saved_videos = [
        {
            "id": v.id,
            "youtube_video_id": v.youtube_video_id,
            "title": v.title,
            "channel_title": v.channel.title if v.channel else "Creator",
            "view_count": v.view_count,
            "thumbnail_url": v.thumbnail_url,
            "duration_formatted": format_duration_seconds(v.duration_seconds or 0),
            "created_at": v.created_at,
            "youtube_url": f"https://www.youtube.com/watch?v={v.youtube_video_id}",
        }
        for v in recent_video_objs
    ]

    # 6. System Provider Status
    system_status = {
        "database": "healthy",
        "youtube_api": "live" if (settings.YOUTUBE_API_KEY and settings.YOUTUBE_API_KEY.strip()) else "mock_mode",
        "gemini_api": "live" if (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()) else "mock_mode",
    }

    return {
        "total_saved_videos": total_saved_videos,
        "total_tracked_competitors": total_tracked_competitors,
        "total_ideas_in_pipeline": total_ideas,
        "ideas_by_status": ideas_by_status,
        "top_opportunities": top_opportunities,
        "recent_saved_videos": recent_saved_videos,
        "system_status": system_status,
    }


@router.get(
    "/diagnostics",
    summary="System and API Diagnostics",
    description="Runs live database connection check and reports API configuration states.",
)
def get_system_diagnostics(
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    # Test DB Connection & Latency
    start_time = time.perf_counter()
    db_healthy = False
    error_msg = None
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as exc:
        error_msg = str(exc)
    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    has_yt = bool(settings.YOUTUBE_API_KEY and settings.YOUTUBE_API_KEY.strip())
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return {
        "database_status": {
            "status": "healthy" if db_healthy else "unhealthy",
            "latency_ms": latency_ms,
            "error": error_msg,
            "dialect": "PostgreSQL (psycopg3)",
        },
        "youtube_configured": has_yt,
        "youtube_key_snippet": _mask_api_key(settings.YOUTUBE_API_KEY),
        "youtube_mode": "Live YouTube Data API v3" if has_yt else "Offline Simulation (Mock Data)",
        "gemini_configured": has_gemini,
        "gemini_key_snippet": _mask_api_key(settings.GEMINI_API_KEY),
        "gemini_mode": "Live Google GenAI (Gemini 2.0 Flash)" if has_gemini else "Offline Studio Generator",
        "environment": settings.ENVIRONMENT,
        "project_name": settings.PROJECT_NAME,
        "debug": settings.DEBUG,
    }
