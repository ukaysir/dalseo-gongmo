export type ImpactCategory =
  | "traffic"
  | "construction"
  | "urban_plan"
  | "council"
  | "public_notice"
  | "event"
  | "safety"
  | "parking"
  | "heat"
  | "facility"
  | "welfare"
  | "environment";

export type ImpactItem = {
  id: string;
  source_id?: string;
  title: string;
  category: ImpactCategory;
  source_name: string;
  source_url: string;
  source_type?: string;
  source_status?: string;
  address: string;
  dong: string;
  lat: number;
  lng: number;
  starts_at: string | null;
  ends_at: string | null;
  opinion_due_at: string | null;
  summary: string;
  plain_summary: string;
  impacts: string[];
  action_guide: string;
  department: string;
  contact: string;
  updated_at: string;
  collected_at?: string;
  raw_text_path?: string | null;
  location_confidence?: string;
  summary_confidence?: string;
  urgency?: string;
  is_demo?: boolean;
  impact_radius_m?: number;
  distance_m?: number;
  relevance_score?: number;
};

export type AddressCandidate = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export type SourceRecord = {
  id: string;
  name: string;
  url: string;
  kind: string;
  category: ImpactCategory;
  priority?: "high" | "medium" | "low";
  expected_fields?: string[];
  collection_risk?: string;
  status?: number;
  source_status?: string;
  error_message?: string | null;
  raw_file?: string | null;
  title?: string;
  text_preview?: string;
  collected_at?: string;
};

export type CollectionReport = {
  collected_at: string;
  source_count: number;
  successful_source_count: number;
  item_count: number;
  category_counts: Partial<Record<ImpactCategory, number>>;
  source_status_counts: Record<string, number>;
  validation: {
    item_count: number;
    error_count: number;
    warning_count: number;
    errors: string[];
    warnings: string[];
  };
  notes: string[];
};

export type ImpactSearchResponse = {
  query: string;
  center: AddressCandidate;
  radius_m: number;
  generated_at: string;
  source:
    | "supabase"
    | "local_file"
    | "public_api"
    | "supabase+public_api"
    | "local_file+public_api"
    | "sample";
  items: ImpactItem[];
  insight: {
    headline: string;
    bullets: string[];
    next_actions: string[];
  };
};
