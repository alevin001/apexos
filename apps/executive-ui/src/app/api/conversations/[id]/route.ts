import { NextResponse } from "next/server";
import { getConversation, getMessages } from "@/services/conversation-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const messages = await getMessages(id);
    return NextResponse.json({ conversation, messages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load conversation" },
      { status: 500 }
    );
  }
}
