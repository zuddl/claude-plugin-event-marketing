import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { useMemo, useRef, useEffect } from "react";
import { config } from "./config";
import { streamAgentResponse, ChatMessage } from "./anthropic-runtime";

type Props = { onClose: () => void };

// Bridge @assistant-ui/react -> our Anthropic Managed Agent streaming client.
// The adapter receives the full thread on each run and yields incremental
// content updates; we accumulate text deltas from the agent and yield each.
const adapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const history: ChatMessage[] = messages
      .map((m) => {
        const text = m.content
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((c) => c.text)
          .join("");
        return { role: m.role === "user" ? "user" : "assistant", content: text } as ChatMessage;
      })
      .filter((m) => m.content.length > 0);

    const last = history.pop();
    if (!last || last.role !== "user") return;

    let acc = "";
    const queue: string[] = [];
    let done = false;
    let error: unknown = null;

    const promise = streamAgentResponse(history, last.content, {
      onText: (delta) => queue.push(delta),
      onDone: () => { done = true; },
      onError: (err) => { error = err; done = true; },
    });

    while (!done || queue.length > 0) {
      if (abortSignal.aborted) break;
      if (queue.length === 0) {
        await new Promise((r) => setTimeout(r, 30));
        continue;
      }
      acc += queue.shift();
      yield { content: [{ type: "text", text: acc }] };
    }
    await promise;
    if (error) throw error;
  },
};

export function ChatPopup({ onClose }: Props) {
  const runtime = useLocalRuntime(adapter, {
    initialMessages: [
      { role: "assistant", content: [{ type: "text", text: config.welcomeMessage }] },
    ],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="ec-panel" role="dialog" aria-label={`${config.brand.name} chat assistant`}>
        <div className="ec-header">
          {config.brand.logoUrl ? <img src={config.brand.logoUrl} alt="" /> : null}
          <div className="ec-title">{config.brand.name}</div>
          <button className="ec-close" onClick={onClose} aria-label="Close chat">×</button>
        </div>

        <Thread />

        <Composer />

        <div className="ec-footer">Answers come from this event's official materials.</div>
      </div>
    </AssistantRuntimeProvider>
  );
}

function Thread() {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on each new render — assistant-ui doesn't impose a scroll
  // strategy, so we drive the viewport ourselves.
  useEffect(() => {
    const id = setInterval(() => {
      const el = viewportRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <ThreadPrimitive.Root className="ec-thread-root">
      <ThreadPrimitive.Viewport ref={viewportRef} className="ec-thread" autoScroll>
        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <MessagePrimitive.Root className="ec-msg user">
                <MessagePrimitive.Content />
              </MessagePrimitive.Root>
            ),
            AssistantMessage: () => (
              <MessagePrimitive.Root className="ec-msg assistant">
                <MessagePrimitive.Content />
              </MessagePrimitive.Root>
            ),
          }}
        />
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="ec-composer">
      <ComposerPrimitive.Input
        autoFocus
        rows={1}
        placeholder={config.placeholder}
        className="ec-composer-input"
      />
      <ComposerPrimitive.Send className="ec-composer-send">Send</ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}
