from datetime import datetime
import json
import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.ai import (
    ContentPackRequest,
    ContentPackResponse,
    HookSuggestion,
    ResearchReportRequest,
    ResearchReportResponse,
    ThumbnailConcept,
    TitleSuggestion,
)

logger = logging.getLogger(__name__)


class AIStudioClient:
    """
    AI Studio engine powered by Google Gemini (GenAI SDK) with high-fidelity
    mock fallback when GEMINI_API_KEY is not configured or empty.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY

    async def generate_content_pack(
        self,
        request: ContentPackRequest,
        grounded_videos: Optional[List[Dict[str, Any]]] = None,
    ) -> ContentPackResponse:
        """
        Generates an actionable, structured YouTube Content Pack based on the
        topic, niche, format, and optional grounded video research data.
        """
        grounded_data = grounded_videos or []

        if not self.api_key or not self.api_key.strip():
            return self._generate_mock_content_pack(request, grounded_data)

        try:
            return await self._call_gemini_content_pack(request, grounded_data)
        except Exception as exc:
            logger.warning(
                f"Gemini API call failed ({exc}); falling back to mock content pack."
            )
            return self._generate_mock_content_pack(request, grounded_data)

    async def generate_research_report(
        self,
        request: ResearchReportRequest,
        grounded_videos: Optional[List[Dict[str, Any]]] = None,
    ) -> ResearchReportResponse:
        """
        Synthesizes empirical market research from video data into an
        executive intelligence report with clear experimental hypotheses.
        """
        grounded_data = grounded_videos or []

        if not self.api_key or not self.api_key.strip():
            return self._generate_mock_research_report(request, grounded_data)

        try:
            return await self._call_gemini_research_report(request, grounded_data)
        except Exception as exc:
            logger.warning(
                f"Gemini API call failed ({exc}); falling back to mock research report."
            )
            return self._generate_mock_research_report(request, grounded_data)

    async def _call_gemini_content_pack(
        self,
        request: ContentPackRequest,
        grounded_data: List[Dict[str, Any]],
    ) -> ContentPackResponse:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        evidence_context = ""
        if grounded_data:
            lines = []
            for v in grounded_data[:10]:
                title = v.get("title", "")
                views = v.get("view_count", 0)
                channel = v.get("channel_title") or v.get("channel_name", "Unknown")
                lines.append(f"- '{title}' ({views:,} views on channel '{channel}')")
            evidence_context = (
                "Empirical High-Performing Reference Videos in this niche:\n"
                + "\n".join(lines)
                + "\n\n"
            )

        system_instruction = (
            "You are an elite YouTube Content Strategist and Retention Architect. "
            "You formulate highly original, evidence-backed video concepts with intense viewer tension. "
            "STRICT RULES:\n"
            "1. Ban generic, cliché titles like 'Top 5 Tips' or 'Ultimate Guide 2026'.\n"
            "2. Ban unscientific CTR claims (e.g., 'guaranteed 20% CTR').\n"
            "3. Provide exactly 5 distinct title options matching specified psychological angles:\n"
            "   - 'Curiosity Gap'\n"
            "   - 'Contrarian / Hot Take'\n"
            "   - 'High Stakes / Transformation'\n"
            "   - 'Clear Value / How-To'\n"
            "   - 'Curiosity Gap' or 'Contrarian'\n"
            "4. Provide 3 high-retention hooks with spoken word text, delivery style, and visual pacing.\n"
            "5. Provide a chronological narrative outline with timestamp targets and concrete points.\n"
            "6. Provide 2 punchy thumbnail concepts with text overlays of MAX 3-4 WORDS.\n"
            "7. Return valid JSON adhering strictly to the schema provided."
        )

        prompt = (
            f"{evidence_context}"
            f"Topic / Raw Concept: {request.topic_or_concept}\n"
            f"Target Audience: {request.target_audience}\n"
            f"Channel Niche: {request.channel_niche}\n"
            f"Format: {request.format} (Preferred Length: {request.preferred_length})\n"
            f"Tone: {request.tone}\n\n"
            "Synthesize this into a comprehensive YouTube Content Pack."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ContentPackResponse,
                temperature=0.7,
            ),
        )

        parsed_data = json.loads(response.text)
        parsed_data["is_mock"] = False
        return ContentPackResponse.model_validate(parsed_data)

    async def _call_gemini_research_report(
        self,
        request: ResearchReportRequest,
        grounded_data: List[Dict[str, Any]],
    ) -> ResearchReportResponse:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        total_videos = len(grounded_data)
        total_views = sum(v.get("view_count", 0) for v in grounded_data)
        avg_views = int(total_views / max(total_videos, 1))

        sources_summary = []
        for v in grounded_data:
            sources_summary.append(
                f"- '{v.get('title')}' | Channel: {v.get('channel_title', 'Creator')} | Views: {v.get('view_count', 0):,}"
            )

        prompt = (
            f"Research Subject: {request.topic_or_keyword}\n"
            f"Sample Size: {total_videos} videos analyzed (Average Views: {avg_views:,})\n"
            f"Video Evidence Records:\n"
            + "\n".join(sources_summary[:15])
            + "\n\n"
            "Synthesize this market data into an executive-level creator intelligence report. "
            "Highlight observed market patterns, underserved content gaps, audience fatigue risks, "
            "and 3 concrete video experiments with hypotheses and quantifiable success metrics."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResearchReportResponse,
                temperature=0.6,
            ),
        )

        parsed_data = json.loads(response.text)
        parsed_data["is_mock"] = False
        return ResearchReportResponse.model_validate(parsed_data)

    def _generate_mock_content_pack(
        self,
        request: ContentPackRequest,
        grounded_data: List[Dict[str, Any]],
    ) -> ContentPackResponse:
        topic = request.topic_or_concept.strip() or "Modern Software Architecture"
        is_shorts = request.format == "shorts"

        # Grounding context reference
        top_ref = (
            grounded_data[0].get("title", topic)
            if grounded_data
            else f"Top trend in {topic}"
        )

        # 5 Title options across required psychological angles
        titles = [
            TitleSuggestion(
                title=f"Why Senior Engineers Don't Build {topic} Like This Anymore",
                angle="Contrarian / Hot Take",
                rationale="Challenges prevailing developer dogma, triggering immediate curiosity and debate.",
            ),
            TitleSuggestion(
                title=f"I Replaced My Entire {topic} Stack (What Broke Next)",
                angle="High Stakes / Transformation",
                rationale="Frames personal consequence and vulnerability, driving high click-through intent.",
            ),
            TitleSuggestion(
                title=f"The 1 {topic} Mistake Quietly Killing Your Performance",
                angle="Curiosity Gap",
                rationale="Creates fear of missing out and urgent need for verification.",
            ),
            TitleSuggestion(
                title=f"Build a Production-Ready {topic} in 15 Minutes (Zero BS)",
                angle="Clear Value / How-To",
                rationale="Offers explicit ROI and time-bound mastery without fluff.",
            ),
            TitleSuggestion(
                title=f"Stop Learning {topic} The Hard Way",
                angle="Curiosity Gap",
                rationale="Speaks directly to developer burnout and seeks an effortless unlock.",
            ),
        ]

        # 3 Hook options
        hooks = [
            HookSuggestion(
                hook_text=(
                    f"90% of tutorials teach {topic} completely backwards. "
                    "They show you the syntax, but hide the exact architectural flaw that crashes in production. "
                    "Today, we're tearing down the standard approach."
                ),
                style="Bold Statement",
                pacing_notes="Cut directly to screen recording of failing terminal test. Zero logo intro, voice steady and authoritative.",
            ),
            HookSuggestion(
                hook_text=(
                    f"Look at this benchmark graph. That massive latency spike? "
                    f"It happened right after deploying standard {topic} boilerplate. "
                    "Here is what happened under the hood—and how to fix it."
                ),
                style="Visual Problem",
                pacing_notes="Zoom into animated flame graph or latency chart with red callout overlay during the first 3 seconds.",
            ),
            HookSuggestion(
                hook_text=(
                    f"Last week, a junior developer asked me why their {topic} setup was costing $1,400 a month on AWS. "
                    "When I inspected the code, I found the single most common antipattern in modern engineering."
                ),
                style="Story Teaser",
                pacing_notes="Casual desk framing with over-the-shoulder code review angle. High conversational rapport.",
            ),
        ]

        # Detailed Outline
        if is_shorts:
            outline = [
                {
                    "section": "The Hook & The Common Trap",
                    "timestamp_target": "0:00 - 0:12",
                    "key_points": [
                        "Call out the classic mistake developers make with " + topic,
                        "Display visual diff showing bad code vs clean code",
                    ],
                },
                {
                    "section": "The 1-Line Solution",
                    "timestamp_target": "0:12 - 0:40",
                    "key_points": [
                        "Walk through the elegant refactored implementation",
                        "Show benchmark proof or memory footprint reduction",
                    ],
                },
                {
                    "section": "Takeaway & Action",
                    "timestamp_target": "0:40 - 0:58",
                    "key_points": [
                        "Summarize golden rule for production setups",
                        "Call to action: star repo in description / follow for part 2",
                    ],
                },
            ]
        else:
            outline = [
                {
                    "section": "Phase 1: The Inciting Problem & The Hidden Cost",
                    "timestamp_target": "0:00 - 1:45",
                    "key_points": [
                        "Demonstrate real-world failure state or latency bottleneck",
                        "Validate the viewer's frustration with generic documentation",
                        "Establish video roadmap and concrete takeaway promise",
                    ],
                },
                {
                    "section": "Phase 2: Architectural Deconstruction",
                    "timestamp_target": "1:45 - 4:30",
                    "key_points": [
                        "Why the conventional mental model of " + topic + " fails at scale",
                        "Live diagram breakdown using visual canvas / Excalidraw",
                        "Compare legacy pattern vs modern zero-overhead design",
                    ],
                },
                {
                    "section": "Phase 3: The Hands-On Refactor",
                    "timestamp_target": "4:30 - 8:15",
                    "key_points": [
                        "Step-by-step refactoring session in IDE",
                        "Crucial edge cases: error handling, concurrency, memory leaks",
                        "Configuring telemetry and profiling metrics",
                    ],
                },
                {
                    "section": "Phase 4: Benchmarks, Proof & Production Rules",
                    "timestamp_target": "8:15 - 10:45",
                    "key_points": [
                        "Side-by-side performance benchmarks before vs after",
                        "3 non-negotiable rules for your team's code review checklist",
                        "Summary and teaser for next architecture breakdown",
                    ],
                },
            ]

        # 2 Thumbnail concepts
        thumbnails = [
            ThumbnailConcept(
                visual_composition=(
                    f"Split screen: Left side shows cluttered red code editor with '4.2s latency' badge; "
                    f"Right side shows clean glowing dark IDE with '12ms' badge. Creator looking skeptical on left."
                ),
                overlay_text="STOP USING THIS",
                color_contrast_notes="Vibrant crimson red vs neon electric cyan for maximum feed contrast.",
            ),
            ThumbnailConcept(
                visual_composition=(
                    f"Creator in foreground pointing at a bold architectural diagram with a giant yellow warning sign over {topic}. "
                    "Clean dark obsidian studio backdrop."
                ),
                overlay_text="IT FINALLY BROKE",
                color_contrast_notes="Deep obsidian background with warm amber (#F59E0B) typography.",
            ),
        ]

        # Series ideas
        series_ideas = [
            f"Part 2: Stress-Testing {topic} Against 100,000 Concurrent Requests",
            f"The Anti-Pattern Audit: 5 Popular {topic} Libraries You Should Avoid",
            f"From Junior to Principal: How Big Tech Implements {topic}",
        ]

        # Tags and keywords
        tags_and_keywords = [
            topic.lower(),
            f"{topic.lower()} tutorial",
            f"{topic.lower()} architecture",
            "software engineering",
            "developer productivity",
            "clean code",
            "system design",
            "web development 2026",
            "tech stack breakdown",
        ]

        return ContentPackResponse(
            is_mock=True,
            core_hypothesis=(
                f"Audience demand around '{topic}' is saturated with shallow beginner syntax guides, "
                f"creating massive unfulfilled demand for senior-level architectural critique and real-world failure analysis."
            ),
            titles=titles,
            hooks=hooks,
            outline=outline,
            thumbnail_concepts=thumbnails,
            series_ideas=series_ideas,
            tags_and_keywords=tags_and_keywords,
        )

    def _generate_mock_research_report(
        self,
        request: ResearchReportRequest,
        grounded_data: List[Dict[str, Any]],
    ) -> ResearchReportResponse:
        topic = request.topic_or_keyword.strip() or "Developer Productivity & Tooling"
        total_videos = len(grounded_data) or 12

        views_list = [v.get("view_count", 0) for v in grounded_data]
        if views_list:
            total_views = sum(views_list)
            avg_views = int(total_views / len(views_list))
            max_views = max(views_list)
            median_val = sorted(views_list)[len(views_list) // 2] if views_list else 1
            top_ratio = round(max_views / max(median_val, 1), 1)
        else:
            avg_views = 284500
            top_ratio = 4.2

        cited_sources: List[Dict[str, Any]] = []
        if grounded_data:
            for v in grounded_data[:6]:
                cited_sources.append(
                    {
                        "title": v.get("title", "Video"),
                        "views": v.get("view_count", 0),
                        "channel": v.get("channel_title")
                        or v.get("channel_name", "Creator"),
                        "url": v.get(
                            "youtube_url",
                            f"https://www.youtube.com/watch?v={v.get('youtube_video_id', '')}",
                        ),
                    }
                )
        else:
            cited_sources = [
                {
                    "title": f"Why I Stopped Using {topic}",
                    "views": 842000,
                    "channel": "Tech Lead Insights",
                    "url": "https://www.youtube.com/watch?v=mock_src_1",
                },
                {
                    "title": f"The Evolution of {topic} in 100 Seconds",
                    "views": 620000,
                    "channel": "ByteSized Dev",
                    "url": "https://www.youtube.com/watch?v=mock_src_2",
                },
                {
                    "title": f"Building a Real App with {topic}",
                    "views": 215000,
                    "channel": "Code Academy Pro",
                    "url": "https://www.youtube.com/watch?v=mock_src_3",
                },
            ]

        return ResearchReportResponse(
            is_mock=True,
            report_title=f"Market Intelligence Report: {topic.title()}",
            data_summary={
                "total_videos_analyzed": total_videos,
                "avg_views": avg_views,
                "top_performer_ratio": f"{top_ratio}x",
            },
            observed_market_patterns=[
                f"Videos challenging the mainstream adoption of {topic} outperform tutorials by 3.2x view velocity.",
                "Audience retention drops steeply after 6:00 when code snippets lack active visual diffs or visual diagrams.",
                "Shorts highlighting surprising syntax quirks generate 40% higher comment-to-view ratios than benchmark videos.",
            ],
            content_gaps=[
                f"Minimal coverage on debugging and diagnosing production memory leaks in {topic}.",
                "Few creators compare total cost of ownership across competing alternatives with real data.",
                "Lack of intermediate-to-advanced refactoring walkthroughs for existing codebases.",
            ],
            risks_and_caveats=[
                "Beginner 'Hello World' tutorials show signs of severe viewer fatigue and sub-1.0 performance ratios.",
                "Overly clickbaity titles without immediate proof payoff generate high initial bounce rates.",
            ],
            suggested_experiments=[
                {
                    "concept": f"The 24-Hour {topic} Stress Test",
                    "test_format": "Long-form (12-14 min)",
                    "hypothesis": "Concrete empirical benchmarking will outperform standard feature reviews by 2x.",
                    "success_metric": "30,000 views within 7 days, >55% average view duration.",
                },
                {
                    "concept": f"3 {topic} Features You Are Definitely Using Wrong",
                    "test_format": "YouTube Shorts (<60s)",
                    "hypothesis": "Rapid bite-sized correction triggers active debate and high saves/shares.",
                    "success_metric": "75,000 views, >80% view percentage.",
                },
                {
                    "concept": f"I Migrated 50,000 Users Off {topic}",
                    "test_format": "Long-form Case Study",
                    "hypothesis": "High-stakes production war stories create durable search and browse evergreen traffic.",
                    "success_metric": "50,000 views in 14 days, >8% engagement rate.",
                },
            ],
            cited_sources=cited_sources,
        )
