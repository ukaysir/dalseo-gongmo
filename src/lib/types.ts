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
  title: string;
  category: ImpactCategory;
  source_name: string;
  source_url: string;
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

export type ImpactSearchResponse = {
  query: string;
  center: AddressCandidate;
  radius_m: number;
  generated_at: string;
  source: "local_file" | "sample";
  items: ImpactItem[];
  insight: {
    headline: string;
    bullets: string[];
    next_actions: string[];
  };
};
