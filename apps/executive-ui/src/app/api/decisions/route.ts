import { NextResponse } from "next/server";
import { recordDecision } from "@/services/decision-service";
import type { DecisionChoice } from "@/types/executive";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recommendationPackageId, choice, reason } = body;
    if (!recommendationPackageId || !choice) {
      return NextResponse.json(
        { error: "recommendationPackageId and choice required" },
        { status: 400 }
      );
    }
    const result = await recordDecision({
      recommendationPackageId,
      choice: choice as DecisionChoice,
      reason,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to record decision" },
      { status: 500 }
    );
  }
}
