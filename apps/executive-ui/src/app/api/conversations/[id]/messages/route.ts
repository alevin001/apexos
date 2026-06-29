import { NextResponse } from "next/server";
import { processConversationTurn } from "@/adapter/executive-conversation-adapter";
import { getMessages } from "@/services/conversation-service";
import type { DecisionChoice } from "@/types/executive";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const result = await processConversationTurn(id, body.message, {
      clarificationField: body.clarification_field,
      decisionChoice: body.decision_choice as DecisionChoice | undefined,
    });

    const messages = await getMessages(id);

    return NextResponse.json({
      conversation: result.conversation,
      messages,
      awaiting_clarification: result.awaiting_clarification,
      runtime_executed: result.runtime_executed,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to process message" },
      { status: 500 }
    );
  }
}
