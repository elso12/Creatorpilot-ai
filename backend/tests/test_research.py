import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, delete

from app.main import app
from app.core.database import SessionLocal
from app.core.utils import parse_iso8601_duration, format_duration_seconds
from app.models.channel import Channel
from app.models.video import Video
from app.models.snapshot import VideoSnapshot


client = TestClient(app)


def test_iso8601_duration_parser():
    """Verify ISO 8601 parser handles typical YouTube durations and invalid values."""
    assert parse_iso8601_duration("PT1H2M10S") == 3730
    assert parse_iso8601_duration("PT4M33S") == 273
    assert parse_iso8601_duration("PT45S") == 45
    assert parse_iso8601_duration("PT1H") == 3600
    assert parse_iso8601_duration("PT2M") == 120
    assert parse_iso8601_duration("P1DT2H3M4S") == 93784
    assert parse_iso8601_duration("") == 0
    assert parse_iso8601_duration(None) == 0
    assert parse_iso8601_duration("invalid_string") == 0

    assert format_duration_seconds(45) == "0:45"
    assert format_duration_seconds(273) == "4:33"
    assert format_duration_seconds(3730) == "1:02:10"
    assert format_duration_seconds(0) == "0:00"


def test_search_endpoint_returns_200_and_items():
    """
    Test 1: Test 'GET /api/v1/research/search?q=python+tutorial' returns 200 with non-empty items.
    """
    response = client.get("/api/v1/research/search?q=python+tutorial")
    assert response.status_code == 200

    data = response.json()
    assert data["query"] == "python tutorial"
    assert data["total_results"] > 0
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0

    first_item = data["items"][0]
    assert "youtube_video_id" in first_item
    assert "title" in first_item
    assert "channel_title" in first_item
    assert "duration_formatted" in first_item
    assert "view_count" in first_item
    assert "like_count" in first_item
    assert "youtube_url" in first_item
    assert first_item["youtube_url"].startswith("https://www.youtube.com/watch?v=")


def test_search_with_duration_filter():
    """Verify search endpoint handles duration_filter query parameter."""
    response = client.get("/api/v1/research/search?q=ai+coding&duration_filter=short")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    for item in data["items"]:
        assert item["duration_seconds"] < 240


def test_save_and_retrieve_video_flow():
    """
    Test 2 & 3:
    - Test 'POST /api/v1/research/save' successfully writes to PostgreSQL and returns 200.
    - Test 'GET /api/v1/research/saved' returns the saved item.
    """
    unique_suffix = uuid.uuid4().hex[:8]
    test_video_id = f"test_vid_{unique_suffix}"
    test_channel_id = f"test_chan_{unique_suffix}"
    test_title = f"Test Video Tutorial - {unique_suffix}"
    test_channel_title = f"Test Academy {unique_suffix}"

    payload = {
        "youtube_video_id": test_video_id,
        "title": test_title,
        "description": "Comprehensive automated test video for research engine.",
        "published_at": "2026-10-11T12:00:00Z",
        "channel_youtube_id": test_channel_id,
        "channel_title": test_channel_title,
        "thumbnail_url": "https://example.com/thumb.jpg",
        "duration_seconds": 872,
        "view_count": 45000,
        "like_count": 3200,
        "comment_count": 180,
    }

    # Step 1: POST /api/v1/research/save
    save_response = client.post("/api/v1/research/save", json=payload)
    assert save_response.status_code == 200, save_response.text

    saved_data = save_response.json()
    assert saved_data["youtube_video_id"] == test_video_id
    assert saved_data["title"] == test_title
    assert saved_data["channel_title"] == test_channel_title
    assert saved_data["channel_youtube_id"] == test_channel_id
    assert saved_data["duration_formatted"] == "14:32"
    assert saved_data["view_count"] == 45000
    assert saved_data["snapshot_count"] >= 1

    # Step 2: Direct PostgreSQL Verification
    db = SessionLocal()
    try:
        db_chan = db.scalars(
            select(Channel).where(Channel.youtube_channel_id == test_channel_id)
        ).first()
        assert db_chan is not None
        assert db_chan.title == test_channel_title

        db_vid = db.scalars(
            select(Video).where(Video.youtube_video_id == test_video_id)
        ).first()
        assert db_vid is not None
        assert db_vid.title == test_title
        assert db_vid.channel_id == db_chan.id

        db_snapshots = db.scalars(
            select(VideoSnapshot).where(VideoSnapshot.video_id == db_vid.id)
        ).all()
        assert len(db_snapshots) >= 1
        assert db_snapshots[0].view_count == 45000
    finally:
        db.close()

    # Step 3: GET /api/v1/research/saved
    get_saved_resp = client.get("/api/v1/research/saved")
    assert get_saved_resp.status_code == 200

    saved_list = get_saved_resp.json()
    assert isinstance(saved_list, list)

    matching_items = [
        it for it in saved_list if it["youtube_video_id"] == test_video_id
    ]
    assert len(matching_items) == 1
    found_item = matching_items[0]
    assert found_item["title"] == test_title
    assert found_item["channel_title"] == test_channel_title
    assert found_item["snapshot_count"] >= 1

    # Clean up test rows to keep DB clean
    db_cleanup = SessionLocal()
    try:
        db_cleanup.execute(
            delete(Channel).where(Channel.youtube_channel_id == test_channel_id)
        )
        db_cleanup.commit()
    finally:
        db_cleanup.close()
