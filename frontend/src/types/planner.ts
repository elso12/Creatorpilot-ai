export type IdeaStatus =
  | "Idea"
  | "Researching"
  | "Ready"
  | "Published"
  | "Reviewed";

export type IdeaFormat = "long_form" | "shorts";

export interface PlannerIdea {
  id: number;
  title: string;
  hook?: string | null;
  script_outline?: string | null;
  target_audience?: string | null;
  research_notes?: string | null;
  format: IdeaFormat;
  status: IdeaStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlannerIdeaPayload {
  title: string;
  hook?: string;
  script_outline?: string;
  target_audience?: string;
  research_notes?: string;
  format?: IdeaFormat;
  status?: IdeaStatus;
  is_favorite?: boolean;
}

export interface UpdatePlannerIdeaPayload {
  title?: string;
  hook?: string;
  script_outline?: string;
  target_audience?: string;
  research_notes?: string;
  format?: IdeaFormat;
  status?: IdeaStatus;
  is_favorite?: boolean;
}
