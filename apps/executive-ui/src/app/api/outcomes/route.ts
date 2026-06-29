import { NextResponse } from "next/server";
import { recordOutcome } from "@/services/outcome-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.recommendation_package_id || !body.action_taken || !body.observed_outcome) {
      return NextResponse.json(
        { error: "recommendation_package_id, action_taken, and observed_outcome required" },
        { status: 400 }
      );
    }
    const result = await recordOutcome(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to record outcome" },
      { status: 500 }
    );
  }
}
