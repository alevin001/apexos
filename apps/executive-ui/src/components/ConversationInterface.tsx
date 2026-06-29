"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationMessage, ExecutiveConversation } from "@/types/conversation";
import type { DecisionChoice } from "@/types/executive";

function renderMarkdownLite(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isExecutive = message.role === "executive";
  const glassBoxPath = message.metadata?.glass_box_path as string | undefined;

  return (
    <div className={`conversation-message ${isExecutive ? "executive" : "apexos"}`}>
      <div className="message-role">{isExecutive ? "You" : "ApexOS"}</div>
      <div className="message-content">{renderMarkdownLite(message.content)}</div>
      {message.message_type === "glass_box" && glassBoxPath && (
        <Link href={glassBoxPath} className="glass-box-inline-link">
          Open Glass Box →
        </Link>
      )}
      {message.message_type === "recommendation" && glassBoxPath && (
        <Link href={glassBoxPath} className="glass-box-inline-link">
          Inspect full provenance →
        </Link>
      )}
    </div>
  );
}

function DecisionActions({
  onDecision,
  loading,
}: {
  onDecision: (choice: DecisionChoice) => void;
  loading: boolean;
}) {
  return (
    <div className="conversation-actions">
      <span className="actions-label">Your decision:</span>
      <button type="button" disabled={loading} onClick={() => onDecision("accepted")}>
        Accept
      </button>
      <button type="button" disabled={loading} onClick={() => onDecision("modified")}>
        Modify
      </button>
      <button type="button" disabled={loading} onClick={() => onDecision("rejected")}>
        Reject
      </button>
    </div>
  );
}

export function ConversationInterface() {
  const [conversation, setConversation] = useState<ExecutiveConversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarificationField, setClarificationField] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/conversations", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to start conversation");

        setConversation(data);
        setMessages([
          {
            id: "welcome",
            conversation_id: data.id,
            role: "apexos",
            content:
              "Describe what's on your mind — a leadership challenge, strategic decision, difficult conversation, or situation that needs executive attention. I'll work through the reasoning pipeline and present recommendations with full transparency.",
            message_type: "text",
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize");
      }
    }
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(message: string, extras?: { decisionChoice?: DecisionChoice }) {
    if (!conversation || !message.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          clarification_field: clarificationField,
          decision_choice: extras?.decisionChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message");

      setConversation(data.conversation);
      setMessages(data.messages);
      setClarificationField(undefined);

      if (data.awaiting_clarification) {
        const lastApex = [...data.messages].reverse().find((m: ConversationMessage) => m.role === "apexos");
        if (lastApex?.metadata?.field) {
          setClarificationField(lastApex.metadata.field as string);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleDecision(choice: DecisionChoice) {
    sendMessage(`I ${choice} the recommendation.`, { decisionChoice: choice });
  }

  const showDecisionActions =
    conversation?.status === "decision_pending" || conversation?.status === "runtime_executed";

  const situationSlug = conversation?.situation_slug;

  return (
    <div className="conversation-panel">
      {error && <div className="error-banner">{error}</div>}

      <div className="conversation-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="conversation-message apexos">
            <div className="message-role">ApexOS</div>
            <div className="message-content thinking">Working through the executive pipeline…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showDecisionActions && situationSlug && (
        <DecisionActions onDecision={handleDecision} loading={loading} />
      )}

      {situationSlug && (
        <div className="conversation-context-bar">
          <Link href={`/situations/${situationSlug}`}>Situation workspace</Link>
          <Link href={`/situations/${situationSlug}/provenance`}>Glass Box</Link>
          {conversation?.status === "outcome_pending" && (
            <Link href={`/situations/${situationSlug}/outcome`}>Capture outcome</Link>
          )}
        </div>
      )}

      <form className="conversation-input-form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            conversation?.status === "outcome_pending"
              ? "Describe what happened — actions taken and observed results…"
              : conversation?.status === "clarifying"
                ? "Provide the details I asked about…"
                : "Describe your situation…"
          }
          rows={3}
          disabled={loading || conversation?.status === "completed"}
        />
        <button type="submit" disabled={loading || !input.trim() || conversation?.status === "completed"}>
          {loading ? "Processing…" : "Send"}
        </button>
      </form>
    </div>
  );
}
