/**
 * useChat — unified conversation state machine for both free-form chat
 * (Conversar page) and guided tutorial flow (Welcome page).
 *
 * BEFORE (problem):
 *   - conversar.tsx managed its own: messages[], input, loading, scroll, send
 *   - welcome.tsx managed its own: answer, checking, feedback, phase machine
 *   - Both used chatWithMia/checkAnswer but with duplicated boilerplate
 *   - Both handled speech-to-text differently
 *   - Both had separate scroll-to-bottom logic
 *
 * AFTER (unified):
 *   - useChat provides: messages, input, loading, send, scrollRef
 *   - Welcome uses the phase machine ON TOP of useChat (guided flow)
 *   - Conversar uses useChat directly (free-form flow)
 *   - Speech-to-text is handled by the caller (different UX needs)
 *
 * DESIGN DECISION: The hook does NOT own speech recognition.
 *   Reason: Welcome and Conversar have different mic UX.
 *   Welcome has a dedicated mic button with visual states.
 *   Conversar integrates mic into the input bar.
 *   Speech is an input source, not chat state.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UseChatOptions {
  /** Initial messages to populate the conversation */
  initialMessages?: ChatMessage[];
  /** Called when the user sends a message. Must return the assistant's reply. */
  onSend: (messages: ChatMessage[]) => Promise<string>;
  /** Called when send fails. If not provided, error is thrown. */
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  /** All messages in the conversation */
  messages: ChatMessage[];
  /** Append a user message and fetch assistant reply */
  send: (text: string) => Promise<void>;
  /** Whether an assistant response is pending */
  loading: boolean;
  /** Ref to attach to the scrollable message container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Manually append a message (for system/openers) */
  append: (message: ChatMessage) => void;
  /** Replace all messages (for reset/ navigation) */
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { initialMessages = [], onSend, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  // Keep ref in sync for send() closure
  messagesRef.current = messages;

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Use requestAnimationFrame to scroll after render
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, loading]);

  const append = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messagesRef.current, userMsg];

      setMessages(nextMessages);
      setLoading(true);

      try {
        const reply = await onSend(nextMessages);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (onError) {
          onError(error);
        } else {
          // Append error as assistant message so user sees something
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Desculpe, não consegui responder agora. Tente novamente.`,
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, onSend, onError]
  );

  return {
    messages,
    send,
    loading,
    scrollRef,
    append,
    setMessages,
  };
}
