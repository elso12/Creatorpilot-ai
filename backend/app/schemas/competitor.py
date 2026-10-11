from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AddCompetitorRequest(BaseModel):
    identifier: str = Field(
        ...,
        min_length=1,
        description="YouTube Channel ID (e.g. UC_...) or Channel Handle (e.g. @Fireship)",
    )


class CompetitorChannelResponse(BaseModel):
    id: int
    youtube_channel_id: str
    title: str
    custom_url: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subscriber_count: int = 0
    video_count: int = 0
    view_count: int = 0
    is_competitor: bool = True
    saved_videos_count: int = 0
    median_views: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetitorVideoResponse(BaseModel):
    id: int
    youtube_video_id: str
    channel_id: int
    channel_title: str
    title: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    duration_seconds: int = 0
    duration_formatted: str = "0:00"
    thumbnail_url: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    opportunity_score: int = 0
    performance_ratio: float = 1.0
    views_per_day: float = 0.0
    engagement_rate: float = 0.0
    classification: str = "Average"
    breakdown: Dict[str, Any] = {}
    youtube_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SnapshotItemDetail(BaseModel):
    video_id: int
    youtube_video_id: str
    title: str
    previous_views: int
    current_views: int
    views_delta: int
    snapshot_count: int


class CompetitorSnapshotResponse(BaseModel):
    channel_id: int
    channel_title: str
    videos_updated: int
    total_views_delta: int
    recorded_at: datetime
    items: List[SnapshotItemDetail]
