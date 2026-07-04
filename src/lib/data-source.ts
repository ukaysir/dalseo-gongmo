import {
  readLocalCollectionReport,
  readLocalImpactItems,
  readLocalSources,
} from "@/lib/local-data";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { CollectionReport, ImpactItem, SourceRecord } from "@/lib/types";

export type ImpactDataSource = "supabase" | "local_file";

type NullableImpactFields =
  | "source_id"
  | "source_type"
  | "source_status"
  | "collected_at"
  | "location_confidence"
  | "summary_confidence"
  | "urgency"
  | "is_demo"
  | "impact_radius_m";

type ImpactItemRow = Omit<
  ImpactItem,
  "id" | "distance_m" | "relevance_score" | NullableImpactFields
> & {
  external_id: string;
  impacts: string[] | null;
  source_id: string | null;
  source_type: string | null;
  source_status: string | null;
  collected_at: string | null;
  location_confidence: string | null;
  summary_confidence: string | null;
  urgency: string | null;
  is_demo: boolean | null;
  impact_radius_m: number | null;
};

type SourceRecordRow = Omit<SourceRecord, "expected_fields"> & {
  expected_fields: string[] | null;
};

export async function readImpactItemsWithSource(): Promise<{
  items: ImpactItem[];
  source: ImpactDataSource;
}> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("impact_items")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Supabase impact_items read failed; falling back to local data", error.message);
    } else if (data.length > 0) {
      return {
        items: (data as unknown as ImpactItemRow[]).map(toImpactItem),
        source: "supabase",
      };
    }
  }

  return {
    items: await readLocalImpactItems(),
    source: "local_file",
  };
}

export async function readSources() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .order("collected_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.warn("Supabase sources read failed; falling back to local data", error.message);
    } else if (data.length > 0) {
      return (data as unknown as SourceRecordRow[]).map(toSourceRecord);
    }
  }

  return readLocalSources();
}

export async function readCollectionReport() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("collection_reports")
      .select("report")
      .eq("id", "latest")
      .maybeSingle();

    if (error) {
      console.warn(
        "Supabase collection_reports read failed; falling back to local data",
        error.message,
      );
    } else if (data?.report) {
      return data.report as CollectionReport;
    }
  }

  return readLocalCollectionReport();
}

function toImpactItem(row: ImpactItemRow): ImpactItem {
  const {
    external_id: id,
    source_id,
    source_type,
    source_status,
    collected_at,
    location_confidence,
    summary_confidence,
    urgency,
    is_demo,
    impact_radius_m,
    impacts,
    ...item
  } = row;

  return {
    ...item,
    id,
    source_id: source_id ?? undefined,
    source_type: source_type ?? undefined,
    source_status: source_status ?? undefined,
    impacts: impacts ?? [],
    collected_at: collected_at ?? undefined,
    location_confidence: location_confidence ?? undefined,
    summary_confidence: summary_confidence ?? undefined,
    urgency: urgency ?? undefined,
    is_demo: is_demo ?? undefined,
    impact_radius_m: impact_radius_m ?? undefined,
  };
}

function toSourceRecord(row: SourceRecordRow): SourceRecord {
  const { expected_fields, ...source } = row;

  return {
    ...source,
    expected_fields: expected_fields ?? undefined,
  };
}
