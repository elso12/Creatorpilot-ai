from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TitleSuggestion(BaseModel):
    title: str = Field(..., description="Compelling video title")
    angle: str = Field(
        ...,
        description="Psychological hook angle (e.g. Curiosity Gap, Contrarian / Hot Take, High Stakes / Transformation, Clear Value / How-To)",
    )
    rationale: str = Field(
        ..., description="Strategic explanation for why this title creates click intent"
    )


class HookSuggestion(BaseModel):
    hook_text: str = Field(
        ..., description="First 10-15 seconds script / spoken hook words"
    )
    style: str = Field(
        ..., description="Style classification (e.g. Visual Problem, Bold Statement, Story Teaser)"
    )
    pacing_notes: str = Field(
        ..., description="Visual actions, B-roll cues, or pacing advice"
    )


class ThumbnailConcept(BaseModel):
    visual_composition: str = Field(
        ..., description="Visual scene layout, subject expression, background context"
    )
    overlay_text: str = Field(
        ..., description="Punchy text overlay on thumbnail, max 3-4 words"
    )
    color_contrast_notes: str = Field(
        ..., description="Palette suggestions for high scroll-stopping contrast"
    )


class OutlineSection(BaseModel):
    section: str = Field(..., description="Section title or narrative phase")
    timestamp_target: str = Field(
        ..., description="Target time mark (e.g. 0:00-0:45, 1:15-3:30)"
    )
    key_points: List[str] = Field(
        default_factory=list, description="Bullet points to cover"
    )


class ContentPackRequest(BaseModel):
    topic_or_concept: str = Field(
        ..., description="Core video topic, idea draft, or query"
    )
    target_audience: str = Field(
        default="Aspiring Developers & Tech Enthusiasts",
        description="Target viewer persona",
    )
    channel_niche: str = Field(
        default="Software Engineering & Tech", description="Creator niche or discipline"
    )
    format: str = Field(
        default="long_form", description="Format type: 'long_form' or 'shorts'"
    )
    tone: str = Field(
        default="Educational, Engaging, Practical",
        description="Delivery style and tone",
    )
    preferred_length: str = Field(
        default="8-12 minutes", description="Target video length duration"
    )
    referenced_video_ids: List[int] = Field(
        default_factory=list,
        description="IDs of saved research or competitor videos to ground synthesis",
    )


class ContentPackResponse(BaseModel):
    is_mock: bool = Field(
        default=False, description="Whether generated via fallback mock data"
    )
    core_hypothesis: str = Field(
        ..., description="Underlying thesis explaining why this topic will perform"
    )
    titles: List[TitleSuggestion] = Field(
        default_factory=list, description="List of title suggestions across angles"
    )
    hooks: List[HookSuggestion] = Field(
        default_factory=list, description="Opening hooks with delivery advice"
    )
    outline: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured video outline sections with timestamps and key points",
    )
    thumbnail_concepts: List[ThumbnailConcept] = Field(
        default_factory=list, description="Thumbnail visual concepts and copy"
    )
    series_ideas: List[str] = Field(
        default_factory=list, description="Related spin-off or follow-up video topics"
    )
    tags_and_keywords: List[str] = Field(
        default_factory=list, description="Recommended search keywords and topic tags"
    )


class ResearchReportRequest(BaseModel):
    topic_or_keyword: str = Field(
        ..., description="Search keyword or research topic for synthesizing findings"
    )
    video_ids: List[int] = Field(
        default_factory=list,
        description="Specific video IDs to include in empirical market synthesis",
    )


class ReportExperiment(BaseModel):
    concept: str = Field(..., description="Proposed test video concept")
    test_format: str = Field(..., description="Format: Shorts, Deep-Dive, Breakdown")
    hypothesis: str = Field(..., description="Expected audience reaction or metric lift")
    success_metric: str = Field(
        ..., description="Measurable indicator of success (e.g. 50k views in 7 days)"
    )


class ReportCitedSource(BaseModel):
    title: str
    views: int
    channel: str
    url: str


class ResearchReportResponse(BaseModel):
    is_mock: bool = Field(default=False)
    report_title: str
    data_summary: Dict[str, Any] = Field(
        ...,
        description="Aggregated metrics: total_videos_analyzed, avg_views, top_performer_ratio",
    )
    observed_market_patterns: List[str] = Field(
        default_factory=list,
        description="Synthesized market trends and audience demand signals",
    )
    content_gaps: List[str] = Field(
        default_factory=list,
        description="Underserved topics, questions, or unanswered pain points",
    )
    risks_and_caveats: List[str] = Field(
        default_factory=list,
        description="Potential pitfalls, saturated angles, or fatigue risks",
    )
    suggested_experiments: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Actionable video tests with clear hypotheses and success metrics",
    )
    cited_sources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Benchmark reference videos cited in analysis",
    )


class SaveIdeaRequest(BaseModel):
    title: str = Field(..., description="Video title")
    hook: Optional[str] = Field(None, description="Opening hook or elevator pitch")
    script_outline: Optional[str] = Field(
        None, description="Structured outline in text or JSON string"
    )
    target_audience: Optional[str] = Field(None, description="Target audience persona")
    format: str = Field(default="long_form", description="Video format")
    status: str = Field(default="Idea", description="Workflow state")


class SaveIdeaResponse(BaseModel):
    id: int
    title: str
    hook: Optional[str] = None
    script_outline: Optional[str] = None
    target_audience: Optional[str] = None
    format: str
    status: str
    created_at: datetime
    updated_at: datetime
