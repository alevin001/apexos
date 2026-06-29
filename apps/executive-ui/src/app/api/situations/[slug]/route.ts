import { NextResponse } from "next/server";
import { archiveSituation } from "@/services/situation-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const situation = await archiveSituation(slug);
    return NextResponse.json(situation);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to archive situation" },
      { status: 500 }
    );
  }
}
