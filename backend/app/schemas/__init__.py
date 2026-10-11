# CreatorPilot AI Pydantic schemas package
from app.schemas.research import (
    VideoItemSchema,
    SearchQueryRequest,
    SearchResponseSchema,
    SaveVideoRequest,
    SavedVideoResponseSchema,
)
from app.schemas.competitor import (
    AddCompetitorRequest,
    CompetitorChannelResponse,
    CompetitorVideoResponse,
    CompetitorSnapshotResponse,
    SnapshotItemDetail,
)
from app.schemas.ai import (
    TitleSuggestion,
    HookSuggestion,
    ThumbnailConcept,
    OutlineSection,
    ContentPackRequest,
    ContentPackResponse,
    ResearchReportRequest,
    ResearchReportResponse,
    SaveIdeaRequest,
    SaveIdeaResponse,
)

__all__ = [
    "VideoItemSchema",
    "SearchQueryRequest",
    "SearchResponseSchema",
    "SaveVideoRequest",
    "SavedVideoResponseSchema",
    "AddCompetitorRequest",
    "CompetitorChannelResponse",
    "CompetitorVideoResponse",
    "CompetitorSnapshotResponse",
    "SnapshotItemDetail",
    "TitleSuggestion",
    "HookSuggestion",
    "ThumbnailConcept",
    "OutlineSection",
    "ContentPackRequest",
    "ContentPackResponse",
    "ResearchReportRequest",
    "ResearchReportResponse",
    "SaveIdeaRequest",
    "SaveIdeaResponse",
]
