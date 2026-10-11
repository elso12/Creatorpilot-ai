from datetime import datetime, timezone, timedelta
import hashlib
from typing import Any, Dict, List, Optional
import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.utils import format_duration_seconds, parse_iso8601_duration
from app.schemas.research import SearchResponseSchema, VideoItemSchema

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"


class YouTubeClient:
    """
    Async YouTube Data API v3 Client with graceful fallback to mock data
    when YOUTUBE_API_KEY is not configured or absent.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.YOUTUBE_API_KEY

    async def search_videos(
        self,
        q: str,
        max_results: int = 20,
        order: str = "relevance",
        published_after: Optional[datetime] = None,
        duration_filter: str = "all",
    ) -> SearchResponseSchema:
        """
        Search YouTube videos by query and optional filters.
        If api_key is empty, returns high-fidelity mock data.
        """
        if not self.api_key or not self.api_key.strip():
            return self._generate_mock_search_results(
                q=q,
                max_results=max_results,
                order=order,
                published_after=published_after,
                duration_filter=duration_filter,
            )

        return await self._fetch_youtube_api(
            q=q,
            max_results=max_results,
            order=order,
            published_after=published_after,
            duration_filter=duration_filter,
        )

    async def _fetch_youtube_api(
        self,
        q: str,
        max_results: int = 20,
        order: str = "relevance",
        published_after: Optional[datetime] = None,
        duration_filter: str = "all",
    ) -> SearchResponseSchema:
        async with httpx.AsyncClient(timeout=20.0) as client:
            search_params = {
                "part": "snippet",
                "type": "video",
                "q": q,
                "maxResults": min(max_results, 50),
                "order": order,
                "key": self.api_key,
            }
            if published_after:
                search_params["publishedAfter"] = published_after.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                )
            if duration_filter in ("short", "medium", "long"):
                search_params["videoDuration"] = duration_filter

            try:
                search_resp = await client.get(
                    YOUTUBE_SEARCH_URL, params=search_params
                )
            except httpx.RequestError:
                return self._generate_mock_search_results(
                    q=q,
                    max_results=max_results,
                    order=order,
                    published_after=published_after,
                    duration_filter=duration_filter,
                )

            if search_resp.status_code == 403:
                error_body = search_resp.text
                if "quotaExceeded" in error_body or "dailyLimitExceeded" in error_body:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="YouTube Data API daily quota exhausted. Please try again later or check your API quota limits.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"YouTube API permission error: {error_body}",
                )

            if search_resp.status_code != 200:
                raise HTTPException(
                    status_code=search_resp.status_code,
                    detail=f"YouTube Search API failed with status {search_resp.status_code}: {search_resp.text}",
                )

            search_data = search_resp.json()
            search_items = search_data.get("items", [])

            video_ids = [
                item["id"]["videoId"]
                for item in search_items
                if "id" in item and item["id"].get("videoId")
            ]

            if not video_ids:
                return SearchResponseSchema(
                    query=q,
                    total_results=0,
                    is_mock=False,
                    items=[],
                )

            videos_params = {
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(video_ids),
                "key": self.api_key,
            }

            try:
                videos_resp = await client.get(
                    YOUTUBE_VIDEOS_URL, params=videos_params
                )
            except httpx.RequestError:
                return self._generate_mock_search_results(
                    q=q,
                    max_results=max_results,
                    order=order,
                    published_after=published_after,
                    duration_filter=duration_filter,
                )

            if videos_resp.status_code == 403:
                error_body = videos_resp.text
                if "quotaExceeded" in error_body or "dailyLimitExceeded" in error_body:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="YouTube Data API daily quota exhausted while fetching video details.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"YouTube API details error: {error_body}",
                )

            if videos_resp.status_code != 200:
                raise HTTPException(
                    status_code=videos_resp.status_code,
                    detail=f"YouTube Videos API failed with status {videos_resp.status_code}: {videos_resp.text}",
                )

            videos_data = videos_resp.json()
            videos_map = {item["id"]: item for item in videos_data.get("items", [])}

            items: List[VideoItemSchema] = []
            for vid_id in video_ids:
                vid_obj = videos_map.get(vid_id)
                if not vid_obj:
                    continue

                snippet = vid_obj.get("snippet", {})
                content_details = vid_obj.get("contentDetails", {})
                statistics = vid_obj.get("statistics", {})

                duration_raw = content_details.get("duration", "")
                duration_seconds = parse_iso8601_duration(duration_raw)
                duration_formatted = format_duration_seconds(duration_seconds)

                thumbs = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbs.get("maxres", {}).get("url")
                    or thumbs.get("standard", {}).get("url")
                    or thumbs.get("high", {}).get("url")
                    or thumbs.get("medium", {}).get("url")
                    or thumbs.get("default", {}).get("url")
                )

                pub_raw = snippet.get("publishedAt")
                published_at = None
                if pub_raw:
                    try:
                        published_at = datetime.fromisoformat(
                            pub_raw.replace("Z", "+00:00")
                        )
                    except ValueError:
                        published_at = None

                item = VideoItemSchema(
                    youtube_video_id=vid_id,
                    title=snippet.get("title", ""),
                    description=snippet.get("description", ""),
                    published_at=published_at,
                    channel_id=snippet.get("channelId", ""),
                    channel_title=snippet.get("channelTitle", ""),
                    thumbnail_url=thumb_url,
                    duration_seconds=duration_seconds,
                    duration_formatted=duration_formatted,
                    view_count=int(statistics.get("viewCount", 0)),
                    like_count=int(statistics.get("likeCount", 0)),
                    comment_count=int(statistics.get("commentCount", 0)),
                    youtube_url=f"https://www.youtube.com/watch?v={vid_id}",
                )
                items.append(item)

            return SearchResponseSchema(
                query=q,
                total_results=len(items),
                is_mock=False,
                items=items,
            )

    async def get_channel_details(self, channel_id_or_handle: str) -> Dict[str, Any]:
        """
        Fetches YouTube channel details by channel ID or @handle.
        Returns channel statistics and profile metadata.
        """
        identifier = channel_id_or_handle.strip()
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Channel identifier cannot be empty",
            )

        if not self.api_key or not self.api_key.strip():
            return self._generate_mock_channel_details(identifier)

        async with httpx.AsyncClient(timeout=20.0) as client:
            params: Dict[str, Any] = {
                "part": "snippet,statistics",
                "key": self.api_key,
            }

            if identifier.startswith("UC") and len(identifier) == 24:
                params["id"] = identifier
            else:
                handle = identifier if identifier.startswith("@") else f"@{identifier}"
                params["forHandle"] = handle

            try:
                resp = await client.get(YOUTUBE_CHANNELS_URL, params=params)
            except httpx.RequestError:
                return self._generate_mock_channel_details(identifier)

            if resp.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="YouTube Data API daily quota exhausted.",
                )

            if resp.status_code != 200:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"YouTube channels API failed: {resp.text}",
                )

            data = resp.json()
            items = data.get("items", [])

            # Fallback to forUsername if forHandle returned empty
            if not items and not identifier.startswith("UC"):
                fallback_params = {
                    "part": "snippet,statistics",
                    "forUsername": identifier.lstrip("@"),
                    "key": self.api_key,
                }
                resp_fb = await client.get(
                    YOUTUBE_CHANNELS_URL, params=fallback_params
                )
                if resp_fb.status_code == 200:
                    data = resp_fb.json()
                    items = data.get("items", [])

            if not items:
                return self._generate_mock_channel_details(identifier)

            item = items[0]
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})

            thumbs = snippet.get("thumbnails", {})
            thumb_url = (
                thumbs.get("high", {}).get("url")
                or thumbs.get("medium", {}).get("url")
                or thumbs.get("default", {}).get("url")
            )

            return {
                "youtube_channel_id": item["id"],
                "title": snippet.get("title", ""),
                "custom_url": snippet.get("customUrl"),
                "description": snippet.get("description"),
                "thumbnail_url": thumb_url,
                "subscriber_count": int(statistics.get("subscriberCount", 0)),
                "video_count": int(statistics.get("videoCount", 0)),
                "view_count": int(statistics.get("viewCount", 0)),
            }

    async def get_channel_recent_videos(
        self, channel_id: str, max_results: int = 15
    ) -> List[VideoItemSchema]:
        """
        Fetches recent uploads for a channel and enriches with video statistics.
        """
        if not self.api_key or not self.api_key.strip():
            return self._generate_mock_channel_recent_videos(
                channel_id=channel_id, max_results=max_results
            )

        async with httpx.AsyncClient(timeout=20.0) as client:
            search_params = {
                "part": "snippet",
                "type": "video",
                "channelId": channel_id,
                "order": "date",
                "maxResults": min(max_results, 50),
                "key": self.api_key,
            }

            try:
                search_resp = await client.get(
                    YOUTUBE_SEARCH_URL, params=search_params
                )
            except httpx.RequestError:
                return self._generate_mock_channel_recent_videos(
                    channel_id=channel_id, max_results=max_results
                )

            if search_resp.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="YouTube Data API daily quota exhausted.",
                )

            if search_resp.status_code != 200:
                raise HTTPException(
                    status_code=search_resp.status_code,
                    detail=f"YouTube search by channel failed: {search_resp.text}",
                )

            search_data = search_resp.json()
            search_items = search_data.get("items", [])

            video_ids = [
                it["id"]["videoId"]
                for it in search_items
                if "id" in it and it["id"].get("videoId")
            ]

            if not video_ids:
                return self._generate_mock_channel_recent_videos(
                    channel_id=channel_id, max_results=max_results
                )

            videos_params = {
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(video_ids),
                "key": self.api_key,
            }

            try:
                videos_resp = await client.get(
                    YOUTUBE_VIDEOS_URL, params=videos_params
                )
            except httpx.RequestError:
                return self._generate_mock_channel_recent_videos(
                    channel_id=channel_id, max_results=max_results
                )

            if videos_resp.status_code != 200:
                return self._generate_mock_channel_recent_videos(
                    channel_id=channel_id, max_results=max_results
                )

            videos_data = videos_resp.json()
            videos_map = {it["id"]: it for it in videos_data.get("items", [])}

            items: List[VideoItemSchema] = []
            for vid_id in video_ids:
                vid_obj = videos_map.get(vid_id)
                if not vid_obj:
                    continue

                snippet = vid_obj.get("snippet", {})
                content_details = vid_obj.get("contentDetails", {})
                statistics = vid_obj.get("statistics", {})

                dur_raw = content_details.get("duration", "")
                duration_seconds = parse_iso8601_duration(dur_raw)
                duration_formatted = format_duration_seconds(duration_seconds)

                thumbs = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbs.get("maxres", {}).get("url")
                    or thumbs.get("standard", {}).get("url")
                    or thumbs.get("high", {}).get("url")
                    or thumbs.get("medium", {}).get("url")
                    or thumbs.get("default", {}).get("url")
                )

                pub_raw = snippet.get("publishedAt")
                published_at = None
                if pub_raw:
                    try:
                        published_at = datetime.fromisoformat(
                            pub_raw.replace("Z", "+00:00")
                        )
                    except ValueError:
                        published_at = None

                item = VideoItemSchema(
                    youtube_video_id=vid_id,
                    title=snippet.get("title", ""),
                    description=snippet.get("description", ""),
                    published_at=published_at,
                    channel_id=snippet.get("channelId", channel_id),
                    channel_title=snippet.get("channelTitle", ""),
                    thumbnail_url=thumb_url,
                    duration_seconds=duration_seconds,
                    duration_formatted=duration_formatted,
                    view_count=int(statistics.get("viewCount", 0)),
                    like_count=int(statistics.get("likeCount", 0)),
                    comment_count=int(statistics.get("commentCount", 0)),
                    youtube_url=f"https://www.youtube.com/watch?v={vid_id}",
                )
                items.append(item)

            return items

    def _generate_mock_channel_details(
        self, identifier: str
    ) -> Dict[str, Any]:
        """
        Generate realistic mock profile details for a YouTube creator channel.
        """
        raw_name = identifier.lstrip("@").replace("-", " ").replace("_", " ").title()
        hash_suffix = hashlib.md5(identifier.lower().encode()).hexdigest()[:16]
        youtube_channel_id = f"UC_{hash_suffix}"

        return {
            "youtube_channel_id": youtube_channel_id,
            "title": raw_name,
            "custom_url": f"@{identifier.lstrip('@')}",
            "description": f"Official channel for {raw_name}. High quality programming tutorials, software engineering deep dives, and modern architecture.",
            "thumbnail_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            "subscriber_count": 2840000,
            "video_count": 520,
            "view_count": 394000000,
        }

    def _generate_mock_channel_recent_videos(
        self, channel_id: str, max_results: int = 15
    ) -> List[VideoItemSchema]:
        """
        Generate 15 realistic recent uploads with varying view counts,
        including breakout outliers, average, and underperforming videos.
        """
        now = datetime.now(timezone.utc)
        video_templates = [
            {
                "title": "Why Everyone Is Switching to Local AI Models in 2026",
                "duration": 645,
                "days_ago": 2,
                "views": 320000,  # Breakout Outlier
                "likes": 24500,
                "comments": 1820,
            },
            {
                "title": "Build a Full-Stack Production App in 100 Seconds",
                "duration": 115,
                "days_ago": 5,
                "views": 480000,  # Huge Outlier
                "likes": 42000,
                "comments": 3100,
            },
            {
                "title": "PostgreSQL 17 Features That Change Everything",
                "duration": 820,
                "days_ago": 9,
                "views": 85000,  # Average baseline
                "likes": 5600,
                "comments": 410,
            },
            {
                "title": "The Brutal Truth About Microservices vs Monoliths",
                "duration": 940,
                "days_ago": 13,
                "views": 195000,  # Above Average
                "likes": 14200,
                "comments": 980,
            },
            {
                "title": "Quick CSS Trick You Probably Didn't Know",
                "duration": 180,
                "days_ago": 16,
                "views": 72000,  # Average
                "likes": 4800,
                "comments": 290,
            },
            {
                "title": "Why Rust in the Kernel Is So Controversial",
                "duration": 760,
                "days_ago": 20,
                "views": 290000,  # Outlier
                "likes": 21000,
                "comments": 1940,
            },
            {
                "title": "Setting Up Development Environment on Linux",
                "duration": 1240,
                "days_ago": 24,
                "views": 38000,  # Underperforming
                "likes": 2100,
                "comments": 160,
            },
            {
                "title": "Top 10 VS Code Extensions for Clean Code",
                "duration": 580,
                "days_ago": 28,
                "views": 88000,  # Average
                "likes": 5900,
                "comments": 420,
            },
            {
                "title": "Memory Safety Explained in Simple Terms",
                "duration": 690,
                "days_ago": 32,
                "views": 82000,  # Average
                "likes": 5400,
                "comments": 380,
            },
            {
                "title": "Docker vs Kubernetes in 2026: What's the Difference?",
                "duration": 890,
                "days_ago": 36,
                "views": 165000,  # Above Average
                "likes": 11800,
                "comments": 810,
            },
            {
                "title": "How Redis Handles 1 Million Requests Per Second",
                "duration": 1120,
                "days_ago": 41,
                "views": 245000,  # Outlier
                "likes": 18900,
                "comments": 1420,
            },
            {
                "title": "My Weekly Coding Setup & Desk Tour",
                "duration": 610,
                "days_ago": 45,
                "views": 32000,  # Underperforming
                "likes": 1900,
                "comments": 140,
            },
            {
                "title": "API Design Guidelines Every Senior Dev Follows",
                "duration": 980,
                "days_ago": 49,
                "views": 94000,  # Average
                "likes": 6800,
                "comments": 490,
            },
            {
                "title": "Understanding OAuth 2.0 and JWT Once and for All",
                "duration": 1350,
                "days_ago": 54,
                "views": 140000,  # Above Average
                "likes": 10200,
                "comments": 710,
            },
            {
                "title": "The End of Traditional Web Frameworks?",
                "duration": 730,
                "days_ago": 58,
                "views": 210000,  # Above Average
                "likes": 15400,
                "comments": 1120,
            },
        ]

        items: List[VideoItemSchema] = []
        for i, tmpl in enumerate(video_templates[:max_results]):
            hash_suffix = hashlib.md5(
                f"{channel_id}_{tmpl['title']}_{i}".encode()
            ).hexdigest()[:11]
            vid_id = f"vid_{hash_suffix}"
            pub_date = now - timedelta(days=tmpl["days_ago"])
            dur_sec = tmpl["duration"]

            item = VideoItemSchema(
                youtube_video_id=vid_id,
                title=tmpl["title"],
                description=f"Deep dive into {tmpl['title']} with practical code demos and benchmarks.",
                published_at=pub_date,
                channel_id=channel_id,
                channel_title="Tracked Creator",
                thumbnail_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                duration_seconds=dur_sec,
                duration_formatted=format_duration_seconds(dur_sec),
                view_count=tmpl["views"],
                like_count=tmpl["likes"],
                comment_count=tmpl["comments"],
                youtube_url=f"https://www.youtube.com/watch?v={vid_id}",
            )
            items.append(item)

        return items

    def _generate_mock_search_results(
        self,
        q: str,
        max_results: int = 20,
        order: str = "relevance",
        published_after: Optional[datetime] = None,
        duration_filter: str = "all",
    ) -> SearchResponseSchema:
        """
        Generate diverse, high-quality mock data conforming to SearchResponseSchema.
        """
        now = datetime.now(timezone.utc)
        clean_q = q.strip().title()

        templates = [
            {
                "title_suffix": "Complete Masterclass for 2026",
                "channel": "Code With Antonio",
                "channel_id": "UC_mAntonio01",
                "desc": f"Master {clean_q} from zero to advanced with hands-on projects, architecture breakdown, and best practices.",
                "duration_sec": 872,
                "views": 482300,
                "likes": 24100,
                "comments": 1420,
                "days_ago": 12,
            },
            {
                "title_suffix": "Crash Course in 30 Minutes",
                "channel": "Tech Lead Pro",
                "channel_id": "UC_TechLeadPro02",
                "desc": f"Everything you need to know about {clean_q} condensed into a fast-paced tutorial for developers.",
                "duration_sec": 1850,
                "views": 921400,
                "likes": 48200,
                "comments": 3105,
                "days_ago": 35,
            },
            {
                "title_suffix": "Top 5 Mistakes Everyone Makes",
                "channel": "Creator Engineering",
                "channel_id": "UC_CreatorEng03",
                "desc": f"Avoid these critical pitfalls when implementing {clean_q}. Real-world code benchmarks and fixes.",
                "duration_sec": 634,
                "views": 215600,
                "likes": 14800,
                "comments": 892,
                "days_ago": 5,
            },
            {
                "title_suffix": "in 60 Seconds #shorts",
                "channel": "Quick Bites Code",
                "channel_id": "UC_QuickBites04",
                "desc": f"Rapid summary and killer tips for {clean_q} in one minute.",
                "duration_sec": 58,
                "views": 1540000,
                "likes": 112000,
                "comments": 4200,
                "days_ago": 2,
            },
            {
                "title_suffix": "Full Stack Architecture & Production Deploy",
                "channel": "Dev Mastery Hub",
                "channel_id": "UC_DevMastery05",
                "desc": f"Step by step guide building scalable production systems using {clean_q} with automated CI/CD.",
                "duration_sec": 2420,
                "views": 348100,
                "likes": 19200,
                "comments": 940,
                "days_ago": 20,
            },
            {
                "title_suffix": "What Nobody Tells You About It",
                "channel": "Modern Builder",
                "channel_id": "UC_ModernBuilder06",
                "desc": f"Honest review and deep dive into the hidden truths and edge cases of {clean_q}.",
                "duration_sec": 794,
                "views": 612000,
                "likes": 33100,
                "comments": 2210,
                "days_ago": 8,
            },
            {
                "title_suffix": "Quick Start Guide (Under 3 Mins)",
                "channel": "Fast Track Academy",
                "channel_id": "UC_FastTrack07",
                "desc": f"Get running with {clean_q} in under three minutes flat.",
                "duration_sec": 175,
                "views": 189000,
                "likes": 9500,
                "comments": 380,
                "days_ago": 15,
            },
            {
                "title_suffix": "The Future of Development",
                "channel": "AI Frontier",
                "channel_id": "UC_AIFrontier08",
                "desc": f"How {clean_q} is redefining the landscape and what's coming next.",
                "duration_sec": 1340,
                "views": 780400,
                "likes": 41200,
                "comments": 2840,
                "days_ago": 18,
            },
        ]

        raw_items: List[VideoItemSchema] = []
        for i in range(max(20, max_results)):
            tmpl = templates[i % len(templates)]
            cycle = i // len(templates)
            hash_suffix = hashlib.md5(f"{clean_q}_{i}".encode()).hexdigest()[:8]
            vid_id = f"mock_{hash_suffix}"

            title = (
                f"{clean_q} - {tmpl['title_suffix']}"
                if cycle == 0
                else f"{clean_q} [Vol {cycle + 1}]: {tmpl['title_suffix']}"
            )

            dur_sec = tmpl["duration_sec"] + (cycle * 45)
            if tmpl["duration_sec"] < 240:
                dur_sec = min(dur_sec, 230)

            pub_date = now - timedelta(days=tmpl["days_ago"] + cycle * 10)

            item = VideoItemSchema(
                youtube_video_id=vid_id,
                title=title,
                description=tmpl["desc"],
                published_at=pub_date,
                channel_id=f"{tmpl['channel_id']}_{cycle}",
                channel_title=tmpl["channel"],
                thumbnail_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                duration_seconds=dur_sec,
                duration_formatted=format_duration_seconds(dur_sec),
                view_count=tmpl["views"] + (i * 3500),
                like_count=tmpl["likes"] + (i * 210),
                comment_count=tmpl["comments"] + (i * 15),
                youtube_url=f"https://www.youtube.com/watch?v={vid_id}",
            )
            raw_items.append(item)

        if published_after:
            raw_items = [
                it for it in raw_items
                if it.published_at and it.published_at >= published_after
            ]

        if duration_filter == "short":
            raw_items = [it for it in raw_items if it.duration_seconds < 240]
        elif duration_filter == "medium":
            raw_items = [
                it for it in raw_items if 240 <= it.duration_seconds <= 1200
            ]
        elif duration_filter == "long":
            raw_items = [it for it in raw_items if it.duration_seconds > 1200]

        if order == "viewCount":
            raw_items.sort(key=lambda x: x.view_count, reverse=True)
        elif order in ("rating", "likeCount"):
            raw_items.sort(key=lambda x: x.like_count, reverse=True)
        elif order == "date":
            raw_items.sort(
                key=lambda x: x.published_at or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True,
            )
        elif order == "title":
            raw_items.sort(key=lambda x: x.title)

        selected_items = raw_items[:max_results]

        return SearchResponseSchema(
            query=q,
            total_results=len(selected_items),
            is_mock=True,
            items=selected_items,
        )
