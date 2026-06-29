import { NextResponse } from "next/server";
import { createSituation } from "@/services/situation-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.situation_summary) {
      return NextResponse.json({ error: "title and situation_summary required" }, { status: 400 });
    }
    const situation = await createSituation(body);
    return NextResponse.json(situation);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create situation" },
      { status: 500 }
    );
  }
}
