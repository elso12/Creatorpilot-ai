import uuid
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_planner_crud_lifecycle():
    """Verify full CRUD lifecycle: create, get with filters, patch status & favorite, and delete."""
    unique_suffix = uuid.uuid4().hex[:6]
    title = f"Building an AI Agent in 2026 ({unique_suffix})"

    # 1. Create custom idea
    create_payload = {
        "title": title,
        "hook": "Why everyone is building agents wrong.",
        "script_outline": "Phase 1: Architecture\nPhase 2: Tooling\nPhase 3: Deployment",
        "target_audience": "Senior Engineers",
        "research_notes": "Benchmark competitor videos show 3x view velocity on agent teardowns.",
        "format": "long_form",
        "status": "Idea",
        "is_favorite": False,
    }
    create_resp = client.post("/api/v1/planner/ideas", json=create_payload)
    assert create_resp.status_code == 201, create_resp.text
    idea_data = create_resp.json()
    idea_id = idea_data["id"]

    assert idea_data["title"] == title
    assert idea_data["status"] == "Idea"
    assert idea_data["is_favorite"] is False

    # 2. List and Filter
    list_resp = client.get("/api/v1/planner/ideas?status=Idea")
    assert list_resp.status_code == 200
    ideas = list_resp.json()
    assert any(i["id"] == idea_id for i in ideas)

    search_resp = client.get(f"/api/v1/planner/ideas?search={unique_suffix}")
    assert search_resp.status_code == 200
    matched = search_resp.json()
    assert len(matched) >= 1
    assert matched[0]["id"] == idea_id

    # 3. Patch status to 'Ready' and favorite toggle
    patch_resp = client.patch(
        f"/api/v1/planner/ideas/{idea_id}",
        json={"status": "Ready", "is_favorite": True},
    )
    assert patch_resp.status_code == 200, patch_resp.text
    updated = patch_resp.json()
    assert updated["status"] == "Ready"
    assert updated["is_favorite"] is True

    # 4. Verify filtered by is_favorite
    fav_resp = client.get("/api/v1/planner/ideas?is_favorite=true")
    assert fav_resp.status_code == 200
    fav_list = fav_resp.json()
    assert any(i["id"] == idea_id for i in fav_list)

    # 5. Delete idea
    del_resp = client.delete(f"/api/v1/planner/ideas/{idea_id}")
    assert del_resp.status_code == 200

    # 6. Verify 404 on deleted
    not_found_resp = client.patch(
        f"/api/v1/planner/ideas/{idea_id}",
        json={"status": "Published"},
    )
    assert not_found_resp.status_code == 404


def test_dashboard_overview():
    """Verify GET /api/v1/dashboard/overview returns consolidated metrics and system status."""
    resp = client.get("/api/v1/dashboard/overview")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "total_saved_videos" in data
    assert "total_tracked_competitors" in data
    assert "total_ideas_in_pipeline" in data
    assert "ideas_by_status" in data
    assert "top_opportunities" in data
    assert "recent_saved_videos" in data
    assert "system_status" in data

    sys_status = data["system_status"]
    assert sys_status["database"] == "healthy"
    assert sys_status["youtube_api"] in ("live", "mock_mode")
    assert sys_status["gemini_api"] in ("live", "mock_mode")


def test_settings_diagnostics():
    """Verify GET /api/v1/settings/diagnostics returns detailed database and API provider diagnostics."""
    resp = client.get("/api/v1/settings/diagnostics")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "database_status" in data
    assert data["database_status"]["status"] == "healthy"
    assert "latency_ms" in data["database_status"]

    assert "youtube_configured" in data
    assert "gemini_configured" in data
    assert "environment" in data
    assert "project_name" in data
