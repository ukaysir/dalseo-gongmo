import { NextResponse } from "next/server";
import { readLocalCollectionReport } from "@/lib/local-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await readLocalCollectionReport();

  if (!report) {
    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        error: "collection-report.json not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    report,
  });
}
