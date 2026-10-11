from datetime import datetime, timezone
from typing import Any, Dict, Optional


def calculate_opportunity_score(
    video_views: int,
    channel_median_views: int,
    published_at: Optional[datetime],
    likes: int,
    comments: int,
    subscriber_count: int,
) -> Dict[str, Any]:
    """
    Calculates the 0-100 Opportunity Score and classification for a YouTube video.
    Identifies high-performing breakout outlier videos relative to channel baseline.
    """
    # 1. Performance ratio
    safe_median = max(int(channel_median_views), 1)
    safe_views = max(int(video_views), 0)
    performance_ratio = safe_views / safe_median

    # 2. Days since published
    now = datetime.now(timezone.utc)
    if published_at:
        if published_at.tzinfo is None:
            pub_date = published_at.replace(tzinfo=timezone.utc)
        else:
            pub_date = published_at
        delta_days = (now - pub_date).total_seconds() / 86400.0
        days_since_published = max(int(delta_days), 1)
    else:
        days_since_published = 1

    # 3. Views per day (velocity)
    views_per_day = safe_views / days_since_published

    # 4. Engagement rate (%)
    engagement_rate = ((max(likes, 0) + max(comments, 0)) / max(safe_views, 1)) * 100.0

    # 5. Component Sub-scores (0 - 100 each)
    # (a) Outlier pull (40% weight): ratio 1.0 = 40 pts, ratio >= 3.0 = 100 pts
    if performance_ratio <= 0.0:
        outlier_subscore = 0.0
    elif performance_ratio < 1.0:
        outlier_subscore = (performance_ratio / 1.0) * 40.0
    elif performance_ratio < 3.0:
        outlier_subscore = 40.0 + ((performance_ratio - 1.0) / 2.0) * 60.0
    else:
        outlier_subscore = 100.0
    outlier_subscore = max(0.0, min(100.0, outlier_subscore))

    # (b) View velocity (30% weight): normalized vs channel expected daily views
    expected_daily = max(safe_median / 30.0, 50.0)
    velocity_ratio = views_per_day / expected_daily
    if velocity_ratio <= 1.0:
        velocity_subscore = velocity_ratio * 40.0
    else:
        velocity_subscore = 40.0 + min(60.0, (velocity_ratio - 1.0) * 30.0)
    velocity_subscore = max(0.0, min(100.0, velocity_subscore))

    # (c) Engagement rate (20% weight): normalized vs 4.0% standard benchmark
    engagement_subscore = min(100.0, (engagement_rate / 4.0) * 80.0)
    engagement_subscore = max(0.0, min(100.0, engagement_subscore))

    # (d) Small channel bonus (10% weight): awarded if subs < 50k and ratio > 1.5
    if subscriber_count < 50000 and performance_ratio > 1.5:
        small_channel_subscore = 100.0
    else:
        small_channel_subscore = 0.0

    # Composite Score (0 - 100)
    raw_composite = (
        (0.40 * outlier_subscore)
        + (0.30 * velocity_subscore)
        + (0.20 * engagement_subscore)
        + (0.10 * small_channel_subscore)
    )
    opportunity_score = int(round(max(0.0, min(100.0, raw_composite))))

    # Classification
    if opportunity_score >= 80:
        classification = "Breakout Outlier"
    elif opportunity_score >= 60:
        classification = "Above Average"
    elif opportunity_score >= 40:
        classification = "Average"
    else:
        classification = "Underperforming"

    return {
        "opportunity_score": opportunity_score,
        "performance_ratio": round(performance_ratio, 2),
        "views_per_day": round(views_per_day, 1),
        "engagement_rate": round(engagement_rate, 2),
        "classification": classification,
        "breakdown": {
            "outlier_subscore": round(outlier_subscore, 1),
            "outlier_weight": 0.40,
            "outlier_points": round(0.40 * outlier_subscore, 1),
            "velocity_subscore": round(velocity_subscore, 1),
            "velocity_weight": 0.30,
            "velocity_points": round(0.30 * velocity_subscore, 1),
            "engagement_subscore": round(engagement_subscore, 1),
            "engagement_weight": 0.20,
            "engagement_points": round(0.20 * engagement_subscore, 1),
            "small_channel_subscore": round(small_channel_subscore, 1),
            "small_channel_weight": 0.10,
            "small_channel_points": round(0.10 * small_channel_subscore, 1),
        },
    }
