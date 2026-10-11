from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateIdeaRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Video title or concept")
    hook: Optional[str] = Field(None, description="Opening spoken hook or pitch")
    script_outline: Optional[str] = Field(None, description="Narrative outline or notes")
    target_audience: Optional[str] = Field(None, description="Audience persona")
    research_notes: Optional[str] = Field(None, description="Research findings or references")
    format: str = Field(default="long_form", description="Video format: long_form or shorts")
    status: str = Field(
        default="Idea",
        description="Workflow state: Idea, Researching, Ready, Published, Reviewed",
    )
    is_favorite: bool = Field(default=False, description="Flag for favorited idea")


class UpdateIdeaRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    hook: Optional[str] = None
    script_outline: Optional[str] = None
    target_audience: Optional[str] = None
    research_notes: Optional[str] = None
    format: Optional[str] = None
    status: Optional[str] = None
    is_favorite: Optional[bool] = None


class IdeaResponse(BaseModel):
    id: int
    title: str
    hook: Optional[str] = None
    script_outline: Optional[str] = None
    target_audience: Optional[str] = None
    research_notes: Optional[str] = None
    format: str
    status: str
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
