import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

// =====================================================================
// MANAGED AGENT STREAMING CLIENT
// ---------------------------------------------------------------------
// This module is the only place that talks to Anthropic. The skill that
// generated this project (event-marketing:attendee-chatbot) walks the
// claude-api skill on each run to make sure the exact SDK method names
// and request shapes here match the current Anthropic SDK version. If
// you're hand-editing, double-check against the SDK before shipping.
//
// Threat model: the API key sits in `config.apiKey` and is baked into
// the bundle. This is only acceptable when the event page is gated
// behind registration. If you need a public-page deployment, switch
// to the token-mint variant (see SKILL.md "Variants").
// =====================================================================

const client = new Anthropic({
  apiKey: config.apiKey,
  dangerouslyAllowBrowser: true,
});

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamHandlers = {
  onText: (delta: string) => void;
  onDone: (full: string) => void;
  onError: (err: unknown) => void;
};

// Conversation id is held in module scope so the managed agent keeps
// the same thread across messages within a single browser session.
// On hard reload, conversation resets — which is correct for an
// attendee bot (no PII retained client-side, every load is fresh).
let conversationId: string | null = null;

export async function streamAgentResponse(
  history: ChatMessage[],
  userMessage: string,
  handlers: StreamHandlers,
): Promise<void> {
  try {
    // Lazily start a conversation on the agent the first time we send.
    if (!conversationId) {
      const conv = await (client as any).agents.conversations.create({
        agent_id: config.agentId,
      });
      conversationId = conv.id;
    }

    // Stream a response. The managed agent loads the attached PDFs and
    // applies the system prompt configured at provisioning time.
    const stream = (client as any).agents.conversations.messages.stream({
      agent_id: config.agentId,
      conversation_id: conversationId,
      content: userMessage,
    });

    let full = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        const piece = event.delta.text ?? "";
        full += piece;
        handlers.onText(piece);
      } else if (event.type === "message_stop") {
        break;
      }
    }
    handlers.onDone(full);
  } catch (err) {
    handlers.onError(err);
  }
}

export function resetConversation(): void {
  conversationId = null;
}
