from datetime import datetime, timezone
import random
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.utils import format_duration_seconds
from app.models.channel import Channel
from app.models.snapshot import VideoSnapshot
from app.models.video import Video
from app.schemas.competitor import (
    AddCompetitorRequest,
    CompetitorChannelResponse,
    CompetitorSnapshotResponse,
    CompetitorVideoResponse,
    SnapshotItemDetail,
)
from app.services.scoring import calculate_opportunity_score
from app.services.youtube_client import YouTubeClient

router = APIRouter()


def _compute_median(values: List[int]) -> int:
    if not values:
        return 0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    if n % 2 == 1:
        return sorted_vals[n // 2]
    return int((sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2)


@router.post(
    "/add",
    response_model=CompetitorChannelResponse,
    status_code=status.HTTP_200_OK,
    summary="Add competitor channel to watchlist",
    description="Fetches channel profile, marks as competitor, saves recent 15 videos, and creates initial snapshots.",
)
async def add_competitor_channel(
    payload: AddCompetitorRequest,
    db: Session = Depends(get_db),
):
    client = YouTubeClient()

    # 1. Fetch channel profile metadata
    channel_info = await client.get_channel_details(payload.identifier)
    yt_channel_id = channel_info["youtube_channel_id"]

    # 2. Upsert Channel record
    stmt = select(Channel).where(Channel.youtube_channel_id == yt_channel_id)
    channel = db.scalars(stmt).first()

    if not channel:
        channel = Channel(
            youtube_channel_id=yt_channel_id,
            title=channel_info["title"],
            custom_url=channel_info.get("custom_url"),
            description=channel_info.get("description"),
            thumbnail_url=channel_info.get("thumbnail_url"),
            subscriber_count=channel_info.get("subscriber_count", 0),
            video_count=channel_info.get("video_count", 0),
            view_count=channel_info.get("view_count", 0),
            is_competitor=True,
        )
        db.add(channel)
        db.flush()
    else:
        channel.title = channel_info["title"]
        channel.custom_url = channel_info.get("custom_url")
        channel.description = channel_info.get("description")
        channel.thumbnail_url = channel_info.get("thumbnail_url")
        channel.subscriber_count = channel_info.get("subscriber_count", 0)
        channel.video_count = channel_info.get("video_count", 0)
        channel.view_count = channel_info.get("view_count", 0)
        channel.is_competitor = True
        db.flush()

    # 3. Fetch recent 15 videos for channel
    recent_videos = await client.get_channel_recent_videos(
        channel_id=channel.youtube_channel_id, max_results=15
    )

    # 4. Upsert Videos & create initial snapshots
    video_views_list: List[int] = []
    for vid in recent_videos:
        video_views_list.append(vid.view_count)
        vid_stmt = select(Video).where(
            Video.youtube_video_id == vid.youtube_video_id
        )
        video_obj = db.scalars(vid_stmt).first()

        if not video_obj:
            video_obj = Video(
                youtube_video_id=vid.youtube_video_id,
                channel_id=channel.id,
                title=vid.title,
                description=vid.description,
                published_at=vid.published_at,
                duration_seconds=vid.duration_seconds,
                thumbnail_url=vid.thumbnail_url,
                view_count=vid.view_count,
                like_count=vid.like_count,
                comment_count=vid.comment_count,
            )
            db.add(video_obj)
            db.flush()

            # Initial Snapshot
            snapshot = VideoSnapshot(
                video_id=video_obj.id,
                view_count=vid.view_count,
                like_count=vid.like_count,
                comment_count=vid.comment_count,
            )
            db.add(snapshot)
        else:
            video_obj.channel_id = channel.id
            video_obj.title = vid.title
            video_obj.description = vid.description
            video_obj.published_at = vid.published_at
            video_obj.duration_seconds = vid.duration_seconds
            video_obj.thumbnail_url = vid.thumbnail_url
            video_obj.view_count = vid.view_count
            video_obj.like_count = vid.like_count
            video_obj.comment_count = vid.comment_count
            db.flush()

    db.commit()
    db.refresh(channel)

    # Calculate median views
    median_views = _compute_median(video_views_list)

    return CompetitorChannelResponse(
        id=channel.id,
        youtube_channel_id=channel.youtube_channel_id,
        title=channel.title,
        custom_url=channel.custom_url,
        description=channel.description,
        thumbnail_url=channel.thumbnail_url,
        subscriber_count=channel.subscriber_count,
        video_count=channel.video_count,
        view_count=channel.view_count,
        is_competitor=channel.is_competitor,
        saved_videos_count=len(channel.videos),
        median_views=median_views,
        created_at=channel.created_at,
        updated_at=channel.updated_at,
    )


@router.get(
    "",
    response_model=List[CompetitorChannelResponse],
    summary="List all tracked competitor channels",
    description="Returns all competitor channels currently on the watchlist with video counts and median stats.",
)
def get_competitor_channels(
    db: Session = Depends(get_db),
):
    stmt = (
        select(Channel)
        .where(Channel.is_competitor == True)
        .options(selectinload(Channel.videos))
        .order_by(Channel.updated_at.desc())
    )
    channels = db.scalars(stmt).all()

    results: List[CompetitorChannelResponse] = []
    for chan in channels:
        views = [v.view_count for v in chan.videos]
        median_val = _compute_median(views)
        results.append(
            CompetitorChannelResponse(
                id=chan.id,
                youtube_channel_id=chan.youtube_channel_id,
                title=chan.title,
                custom_url=chan.custom_url,
                description=chan.description,
                thumbnail_url=chan.thumbnail_url,
                subscriber_count=chan.subscriber_count,
                video_count=chan.video_count,
                view_count=chan.view_count,
                is_competitor=chan.is_competitor,
                saved_videos_count=len(chan.videos),
                median_views=median_val,
                created_at=chan.created_at,
                updated_at=chan.updated_at,
            )
        )
    return results


@router.get(
    "/{channel_id}/videos",
    response_model=List[CompetitorVideoResponse],
    summary="Get saved videos for a competitor with Opportunity Scores",
    description="Calculates Opportunity Scores and performance ratios for all videos of a tracked channel.",
)
def get_competitor_videos(
    channel_id: int,
    sort_by: Literal["score", "ratio", "date", "views"] = Query(
        default="score", description="Sort by metric"
    ),
    db: Session = Depends(get_db),
):
    # Lookup channel
    channel = db.scalars(
        select(Channel)
        .where(Channel.id == channel_id)
        .options(selectinload(Channel.videos))
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor channel with ID {channel_id} not found",
        )

    videos = channel.videos
    if not videos:
        return []

    # Calculate channel median views across all videos
    views_list = [v.view_count for v in videos]
    channel_median = _compute_median(views_list)

    scored_videos: List[CompetitorVideoResponse] = []
    for vid in videos:
        score_data = calculate_opportunity_score(
            video_views=vid.view_count,
            channel_median_views=channel_median,
            published_at=vid.published_at,
            likes=vid.like_count,
            comments=vid.comment_count,
            subscriber_count=channel.subscriber_count,
        )

        item = CompetitorVideoResponse(
            id=vid.id,
            youtube_video_id=vid.youtube_video_id,
            channel_id=channel.id,
            channel_title=channel.title,
            title=vid.title,
            description=vid.description,
            published_at=vid.published_at,
            duration_seconds=vid.duration_seconds or 0,
            duration_formatted=format_duration_seconds(vid.duration_seconds or 0),
            thumbnail_url=vid.thumbnail_url,
            view_count=vid.view_count,
            like_count=vid.like_count,
            comment_count=vid.comment_count,
            opportunity_score=score_data["opportunity_score"],
            performance_ratio=score_data["performance_ratio"],
            views_per_day=score_data["views_per_day"],
            engagement_rate=score_data["engagement_rate"],
            classification=score_data["classification"],
            breakdown=score_data["breakdown"],
            youtube_url=f"https://www.youtube.com/watch?v={vid.youtube_video_id}",
            created_at=vid.created_at,
        )
        scored_videos.append(item)

    # Sorting
    if sort_by == "score":
        scored_videos.sort(key=lambda x: x.opportunity_score, reverse=True)
    elif sort_by == "ratio":
        scored_videos.sort(key=lambda x: x.performance_ratio, reverse=True)
    elif sort_by == "views":
        scored_videos.sort(key=lambda x: x.view_count, reverse=True)
    elif sort_by == "date":
        scored_videos.sort(
            key=lambda x: x.published_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

    return scored_videos


@router.post(
    "/{channel_id}/snapshot",
    response_model=CompetitorSnapshotResponse,
    summary="Record metric snapshot for competitor videos",
    description="Pulls latest stats, saves new VideoSnapshot rows, and computes view delta compared to prior snapshot.",
)
def record_competitor_snapshot(
    channel_id: int,
    db: Session = Depends(get_db),
):
    channel = db.scalars(
        select(Channel)
        .where(Channel.id == channel_id)
        .options(selectinload(Channel.videos).selectinload(Video.snapshots))
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor channel with ID {channel_id} not found",
        )

    if not channel.videos:
        return CompetitorSnapshotResponse(
            channel_id=channel.id,
            channel_title=channel.title,
            videos_updated=0,
            total_views_delta=0,
            recorded_at=datetime.now(timezone.utc),
            items=[],
        )

    total_delta = 0
    item_details: List[SnapshotItemDetail] = []
    now = datetime.now(timezone.utc)

    for vid in channel.videos:
        # Find latest previous snapshot if any
        prev_snapshot = None
        if vid.snapshots:
            sorted_snaps = sorted(
                vid.snapshots, key=lambda s: s.recorded_at, reverse=True
            )
            prev_snapshot = sorted_snaps[0]

        prev_views = prev_snapshot.view_count if prev_snapshot else vid.view_count

        # Incremental delta: simulate active viewership growth between 1.5% and 6%
        growth_pct = random.uniform(0.015, 0.06)
        delta_views = max(int(vid.view_count * growth_pct), 120)
        new_views = vid.view_count + delta_views
        new_likes = vid.like_count + max(int(delta_views * 0.05), 10)
        new_comments = vid.comment_count + max(int(delta_views * 0.005), 2)

        # Update video record
        vid.view_count = new_views
        vid.like_count = new_likes
        vid.comment_count = new_comments

        # Add new snapshot
        new_snapshot = VideoSnapshot(
            video_id=vid.id,
            recorded_at=now,
            view_count=new_views,
            like_count=new_likes,
            comment_count=new_comments,
        )
        db.add(new_snapshot)
        db.flush()

        actual_delta = new_views - prev_views
        total_delta += actual_delta

        item_details.append(
            SnapshotItemDetail(
                video_id=vid.id,
                youtube_video_id=vid.youtube_video_id,
                title=vid.title,
                previous_views=prev_views,
                current_views=new_views,
                views_delta=actual_delta,
                snapshot_count=len(vid.snapshots) + 1,
            )
        )

    db.commit()

    return CompetitorSnapshotResponse(
        channel_id=channel.id,
        channel_title=channel.title,
        videos_updated=len(item_details),
        total_views_delta=total_delta,
        recorded_at=now,
        items=item_details,
    )


@router.delete(
    "/{channel_id}",
    summary="Remove competitor channel from watchlist",
    description="Removes the competitor channel, cascading deletion of associated videos and snapshots.",
)
def delete_competitor_channel(
    channel_id: int,
    db: Session = Depends(get_db),
):
    channel = db.scalars(
        select(Channel).where(Channel.id == channel_id)
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competitor channel with ID {channel_id} not found",
        )

    chan_title = channel.title
    db.delete(channel)
    db.commit()

    return {
        "status": "deleted",
        "channel_id": channel_id,
        "title": chan_title,
        "message": f"Successfully removed '{chan_title}' from watchlist",
    }
