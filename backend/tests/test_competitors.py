import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.services.scoring import calculate_opportunity_score

client = TestClient(app)


def test_opportunity_scoring_engine_math():
    """Verify opportunity score calculation, weights, and classifications."""
    now = datetime.now(timezone.utc)

    # 1. Breakout Outlier case: ratio 3.5x, high velocity, high engagement, small channel
    outlier = calculate_opportunity_score(
        video_views=140000,
        channel_median_views=40000,  # 3.5x
        published_at=now - timedelta(days=7),
        likes=8400,
        comments=420,
        subscriber_count=25000,  # Small channel bonus
    )
    assert outlier["opportunity_score"] >= 80
    assert outlier["classification"] == "Breakout Outlier"
    assert outlier["performance_ratio"] == 3.5
    assert outlier["breakdown"]["outlier_subscore"] == 100.0
    assert outlier["breakdown"]["small_channel_subscore"] == 100.0

    # 2. Benchmark ratio 1.0 test (should be 40 outlier points)
    avg_calc = calculate_opportunity_score(
        video_views=50000,
        channel_median_views=50000,  # 1.0x ratio
        published_at=now - timedelta(days=30),
        likes=2000,
        comments=50,
        subscriber_count=200000,
    )
    assert avg_calc["performance_ratio"] == 1.0
    assert avg_calc["breakdown"]["outlier_subscore"] == 40.0
    assert avg_calc["classification"] in ("Average", "Above Average")

    # 3. Underperforming test
    under = calculate_opportunity_score(
        video_views=8000,
        channel_median_views=60000,  # 0.13x ratio
        published_at=now - timedelta(days=60),
        likes=120,
        comments=10,
        subscriber_count=500000,
    )
    assert under["opportunity_score"] < 40
    assert under["classification"] == "Underperforming"


def test_competitor_lifecycle_and_snapshots():
    """
    Test adding competitor, listing competitors, fetching scored videos,
    taking a metric snapshot with delta calculation, and deleting.
    """
    unique_handle = f"@creator_{uuid.uuid4().hex[:8]}"

    # Step 1: Add competitor
    add_resp = client.post(
        "/api/v1/competitors/add", json={"identifier": unique_handle}
    )
    assert add_resp.status_code == 200, add_resp.text
    channel_data = add_resp.json()
    channel_id = channel_data["id"]

    assert channel_data["is_competitor"] is True
    assert channel_data["saved_videos_count"] == 15
    assert channel_data["median_views"] > 0
    assert channel_data["title"] != ""

    # Step 2: List competitors
    list_resp = client.get("/api/v1/competitors")
    assert list_resp.status_code == 200
    competitors = list_resp.json()
    assert any(c["id"] == channel_id for c in competitors)

    # Step 3: Fetch videos with opportunity scores
    videos_resp = client.get(f"/api/v1/competitors/{channel_id}/videos")
    assert videos_resp.status_code == 200
    videos = videos_resp.json()
    assert len(videos) == 15

    first_video = videos[0]
    assert "opportunity_score" in first_video
    assert "performance_ratio" in first_video
    assert "classification" in first_video
    assert "breakdown" in first_video
    assert first_video["opportunity_score"] >= videos[-1]["opportunity_score"]

    # Step 4: Record metric snapshot and verify views delta
    snap_resp = client.post(f"/api/v1/competitors/{channel_id}/snapshot")
    assert snap_resp.status_code == 200
    snap_data = snap_resp.json()

    assert snap_data["videos_updated"] == 15
    assert snap_data["total_views_delta"] > 0
    assert len(snap_data["items"]) == 15

    for item in snap_data["items"]:
        assert item["views_delta"] > 0
        assert item["current_views"] > item["previous_views"]
        assert item["snapshot_count"] >= 2

    # Step 5: Clean up by deleting competitor
    del_resp = client.delete(f"/api/v1/competitors/{channel_id}")
    assert del_resp.status_code == 200

    # Verify channel no longer exists
    not_found_resp = client.get(f"/api/v1/competitors/{channel_id}/videos")
    assert not_found_resp.status_code == 404
