export interface TitleSuggestion {
  title: string;
  angle: string;
  rationale: string;
}

export interface HookSuggestion {
  hook_text: string;
  style: string;
  pacing_notes: string;
}

export interface ThumbnailConcept {
  visual_composition: string;
  overlay_text: string;
  color_contrast_notes: string;
}

export interface OutlineSection {
  section: string;
  timestamp_target: string;
  key_points: string[];
}

export interface ContentPackRequest {
  topic_or_concept: string;
  target_audience?: string;
  channel_niche?: string;
  format?: "long_form" | "shorts";
  tone?: string;
  preferred_length?: string;
  referenced_video_ids?: number[];
}

export interface ContentPackResponse {
  is_mock: boolean;
  core_hypothesis: string;
  titles: TitleSuggestion[];
  hooks: HookSuggestion[];
  outline: OutlineSection[];
  thumbnail_concepts: ThumbnailConcept[];
  series_ideas: string[];
  tags_and_keywords: string[];
}

export interface ResearchReportRequest {
  topic_or_keyword: string;
  video_ids?: number[];
}

export interface ReportExperiment {
  concept: string;
  test_format: string;
  hypothesis: string;
  success_metric: string;
}

export interface ReportCitedSource {
  title: string;
  views: number;
  channel: string;
  url: string;
}

export interface ResearchReportResponse {
  is_mock: boolean;
  report_title: string;
  data_summary: {
    total_videos_analyzed: number;
    avg_views: number;
    top_performer_ratio: string;
  };
  observed_market_patterns: string[];
  content_gaps: string[];
  risks_and_caveats: string[];
  suggested_experiments: ReportExperiment[];
  cited_sources: ReportCitedSource[];
}

export interface SaveIdeaPayload {
  title: string;
  hook?: string;
  script_outline?: string;
  target_audience?: string;
  format?: string;
  status?: string;
}

export interface SavedIdea {
  id: number;
  title: string;
  hook?: string;
  script_outline?: string;
  target_audience?: string;
  format: string;
  status: string;
  created_at: string;
  updated_at: string;
}
