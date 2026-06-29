import { NextResponse } from "next/server";
import { createConversation, listRecentConversations } from "@/services/conversation-service";

export async function GET() {
  try {
    const conversations = await listRecentConversations();
    return NextResponse.json(conversations);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const conversation = await createConversation();
    return NextResponse.json(conversation);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create conversation" },
      { status: 500 }
    );
  }
}
