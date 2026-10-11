import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models.idea import ContentIdea
from app.models.video import Video

client = TestClient(app)


def test_ai_content_pack_generation():
    """Verify POST /api/v1/ai/content-pack returns 200 with complete structured schema."""
    payload = {
        "topic_or_concept": "Next.js Server Actions Pitfalls",
        "target_audience": "Full-Stack Web Developers",
        "channel_niche": "Modern Web Development",
        "format": "long_form",
        "tone": "Educational, Practical, Direct",
        "preferred_length": "10-12 minutes",
        "referenced_video_ids": [],
    }

    resp = client.post("/api/v1/ai/content-pack", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "is_mock" in data
    assert "core_hypothesis" in data and len(data["core_hypothesis"]) > 0

    # 5 Titles across specified angles
    titles = data["titles"]
    assert len(titles) == 5
    for t in titles:
        assert "title" in t and len(t["title"]) > 0
        assert "angle" in t and len(t["angle"]) > 0
        assert "rationale" in t

    # 3 Hooks
    hooks = data["hooks"]
    assert len(hooks) == 3
    for h in hooks:
        assert "hook_text" in h and len(h["hook_text"]) > 0
        assert "style" in h
        assert "pacing_notes" in h

    # Outline
    outline = data["outline"]
    assert len(outline) >= 3
    for s in outline:
        assert "section" in s
        assert "timestamp_target" in s
        assert "key_points" in s and isinstance(s["key_points"], list)

    # Thumbnail concepts (2 concepts with <= 4 words overlay)
    thumbnails = data["thumbnail_concepts"]
    assert len(thumbnails) >= 2
    for thumb in thumbnails:
        assert "visual_composition" in thumb
        assert "overlay_text" in thumb
        assert "color_contrast_notes" in thumb

    # Series ideas & keywords
    assert len(data["series_ideas"]) >= 2
    assert len(data["tags_and_keywords"]) >= 5


def test_ai_research_report_synthesis():
    """Verify POST /api/v1/ai/research-report returns 200 with verified summary metrics and structured experiments."""
    payload = {
        "topic_or_keyword": "Rust for JavaScript Developers",
        "video_ids": [],
    }

    resp = client.post("/api/v1/ai/research-report", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "is_mock" in data
    assert "report_title" in data
    assert "data_summary" in data

    summary = data["data_summary"]
    assert "total_videos_analyzed" in summary
    assert "avg_views" in summary
    assert "top_performer_ratio" in summary

    # Patterns, gaps, and risks
    assert len(data["observed_market_patterns"]) >= 2
    assert len(data["content_gaps"]) >= 2
    assert len(data["risks_and_caveats"]) >= 1

    # Experiments
    experiments = data["suggested_experiments"]
    assert len(experiments) >= 2
    for exp in experiments:
        assert "concept" in exp
        assert "test_format" in exp
        assert "hypothesis" in exp
        assert "success_metric" in exp

    # Cited sources
    assert len(data["cited_sources"]) >= 1
    for src in data["cited_sources"]:
        assert "title" in src
        assert "views" in src
        assert "url" in src


def test_ai_save_idea_pipeline():
    """Verify POST /api/v1/ai/save-idea persists to database and returns 201."""
    unique_title = "Why Docker in 2026 is Finally Replaced"
    payload = {
        "title": unique_title,
        "hook": "Stop writing Dockerfiles for local development in 2026.",
        "script_outline": "1. The pain of daemon overhead\n2. Modern microVM alternatives\n3. Migration guide",
        "target_audience": "DevOps & Cloud Engineers",
        "format": "long_form",
        "status": "Idea",
    }

    resp = client.post("/api/v1/ai/save-idea", json=payload)
    assert resp.status_code == 201, resp.text
    created = resp.json()

    assert created["id"] > 0
    assert created["title"] == unique_title
    assert created["format"] == "long_form"
    assert created["status"] == "Idea"

    # Verify directly in DB
    db = SessionLocal()
    try:
        stmt = select(ContentIdea).where(ContentIdea.id == created["id"])
        db_idea = db.scalars(stmt).first()
        assert db_idea is not None
        assert db_idea.title == unique_title
        assert db_idea.target_audience == "DevOps & Cloud Engineers"

        # Cleanup
        db.delete(db_idea)
        db.commit()
    finally:
        db.close()
