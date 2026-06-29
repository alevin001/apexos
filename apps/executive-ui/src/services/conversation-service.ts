import { getSupabaseServer, appendTransformationLog } from "./supabase-server";
import type {
  ConversationLifecycleStatus,
  ConversationMessage,
  ExecutiveConversation,
  MessageRole,
  MessageType,
  SituationPackage,
} from "@/types/conversation";

const memoryStore = new Map<string, ExecutiveConversation>();
const memoryMessages = new Map<string, ConversationMessage[]>();

let tablesChecked = false;
let useMemoryFallback = false;

async function checkTables(): Promise<boolean> {
  if (tablesChecked) return !useMemoryFallback;
  tablesChecked = true;
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("executive_conversations").select("id").limit(1);
    useMemoryFallback = !!error;
  } catch {
    useMemoryFallback = true;
  }
  return !useMemoryFallback;
}

function newExternalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function rowToConversation(row: Record<string, unknown>): ExecutiveConversation {
  return {
    id: row.id as string,
    external_id: row.external_id as string,
    status: row.status as ExecutiveConversation["status"],
    classification: row.classification as ExecutiveConversation["classification"],
    situation_id: (row.situation_id as string) ?? null,
    situation_slug: (row.situation_slug as string) ?? null,
    situation_package: (row.situation_package as SituationPackage) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToMessage(row: Record<string, unknown>): ConversationMessage {
  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    role: row.role as MessageRole,
    content: row.content as string,
    message_type: row.message_type as MessageType,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}

export async function createConversation(): Promise<ExecutiveConversation> {
  const externalId = newExternalId("CONV");
  const now = new Date().toISOString();

  if (!(await checkTables())) {
    const id = crypto.randomUUID();
    const conv: ExecutiveConversation = {
      id,
      external_id: externalId,
      status: "active",
      classification: null,
      situation_id: null,
      situation_slug: null,
      situation_package: null,
      created_at: now,
      updated_at: now,
    };
    memoryStore.set(id, conv);
    memoryMessages.set(id, []);
    return conv;
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("executive_conversations")
    .insert({
      external_id: externalId,
      status: "active",
      transformation_log: appendTransformationLog([], {
        action: "created",
        rationale: "Executive conversation started",
        actor: "conversation-adapter",
      }),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToConversation(data);
}

export async function getConversation(id: string): Promise<ExecutiveConversation | null> {
  if (!(await checkTables())) {
    return memoryStore.get(id) ?? null;
  }

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("executive_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? rowToConversation(data) : null;
}

export async function updateConversation(
  id: string,
  updates: Partial<{
    status: ConversationLifecycleStatus;
    classification: ExecutiveConversation["classification"];
    situation_id: string | null;
    situation_slug: string | null;
    situation_package: SituationPackage | null;
  }>
): Promise<ExecutiveConversation> {
  const now = new Date().toISOString();

  if (!(await checkTables())) {
    const existing = memoryStore.get(id);
    if (!existing) throw new Error("Conversation not found");
    const updated = { ...existing, ...updates, updated_at: now };
    memoryStore.set(id, updated);
    return updated;
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("executive_conversations")
    .update({ ...updates, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToConversation(data);
}

export async function addMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
  messageType?: MessageType;
  metadata?: Record<string, unknown>;
}): Promise<ConversationMessage> {
  const now = new Date().toISOString();
  const messageType = input.messageType ?? "text";

  if (!(await checkTables())) {
    const msg: ConversationMessage = {
      id: crypto.randomUUID(),
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      message_type: messageType,
      metadata: input.metadata ?? {},
      created_at: now,
    };
    const msgs = memoryMessages.get(input.conversationId) ?? [];
    msgs.push(msg);
    memoryMessages.set(input.conversationId, msgs);
    return msg;
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      message_type: messageType,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToMessage(data);
}

export async function getMessages(conversationId: string): Promise<ConversationMessage[]> {
  if (!(await checkTables())) {
    return memoryMessages.get(conversationId) ?? [];
  }

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map(rowToMessage);
}

export async function listRecentConversations(limit = 10): Promise<ExecutiveConversation[]> {
  if (!(await checkTables())) {
    return [...memoryStore.values()]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit);
  }

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("executive_conversations")
    .select("*")
    .neq("status", "dismissed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(rowToConversation);
}
