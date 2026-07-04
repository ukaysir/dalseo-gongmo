import { NextResponse } from "next/server";
import { readCollectionReport } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await readCollectionReport();

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
