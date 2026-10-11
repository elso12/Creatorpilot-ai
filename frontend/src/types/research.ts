export interface VideoItem {
  youtube_video_id: string;
  title: string;
  description: string;
  published_at?: string | null;
  channel_id: string;
  channel_title: string;
  thumbnail_url?: string | null;
  duration_seconds: number;
  duration_formatted: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  youtube_url: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  is_mock: boolean;
  items: VideoItem[];
}

export interface SavedVideo {
  id: number;
  youtube_video_id: string;
  channel_id?: number | null;
  channel_youtube_id?: string | null;
  channel_title?: string | null;
  title: string;
  description?: string | null;
  published_at?: string | null;
  duration_seconds?: number | null;
  duration_formatted?: string;
  thumbnail_url?: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  snapshot_count: number;
  created_at: string;
  updated_at?: string;
}

export interface SaveVideoPayload {
  youtube_video_id: string;
  title: string;
  description?: string | null;
  published_at?: string | null;
  channel_youtube_id: string;
  channel_title: string;
  thumbnail_url?: string | null;
  duration_seconds?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}
