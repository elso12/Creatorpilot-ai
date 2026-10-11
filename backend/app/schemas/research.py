from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class VideoItemSchema(BaseModel):
    youtube_video_id: str
    title: str
    description: str
    published_at: Optional[datetime] = None
    channel_id: str
    channel_title: str
    thumbnail_url: Optional[str] = None
    duration_seconds: int = 0
    duration_formatted: str = "0:00"  # e.g., '14:32'
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    youtube_url: str


class SearchQueryRequest(BaseModel):
    q: str = Field(..., min_length=1)
    max_results: int = Field(default=20, ge=1, le=50)
    order: Literal[
        "date", "rating", "relevance", "title", "videoCount", "viewCount"
    ] = "relevance"
    published_after: Optional[datetime] = None
    duration_filter: Literal["all", "short", "medium", "long"] = "all"


class SearchResponseSchema(BaseModel):
    query: str
    total_results: int
    is_mock: bool
    items: List[VideoItemSchema]


class SaveVideoRequest(BaseModel):
    youtube_video_id: str
    title: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    channel_youtube_id: str
    channel_title: str
    thumbnail_url: Optional[str] = None
    duration_seconds: int = 0
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0


class SavedVideoResponseSchema(BaseModel):
    id: int
    youtube_video_id: str
    channel_id: Optional[int] = None
    channel_youtube_id: Optional[str] = None
    channel_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    duration_formatted: str = "0:00"
    thumbnail_url: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    snapshot_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
