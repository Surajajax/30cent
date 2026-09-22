"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  getApiUrl,
  getBackendErrorMessage,
} from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm your 30cent financial assistant. Ask me about your balance, spending, stocks, market news, or transactions.",
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<
    number | null
  >(null);

  const [loadingConversation, setLoadingConversation] =
    useState(true);

  // =========================================================
  // LOAD LATEST CONVERSATION
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadLatestConversation() {
      try {
        setLoadingConversation(true);

        const response = await fetch(
          getApiUrl(
            "/api/agent/conversations/latest",
          ),
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load conversation: ${response.status}`,
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const conversation = data.conversation;

        // ---------------------------------------------------
        // No existing conversation
        // ---------------------------------------------------

        if (!conversation) {
          setConversationId(null);
          setMessages([WELCOME_MESSAGE]);
          return;
        }

        // ---------------------------------------------------
        // Restore existing conversation
        // ---------------------------------------------------

        setConversationId(
          typeof conversation.id === "number"
            ? conversation.id
            : null,
        );

        if (
          Array.isArray(conversation.messages) &&
          conversation.messages.length > 0
        ) {
          setMessages(
            conversation.messages.map(
              (message: Message) => ({
                role: message.role,
                content: message.content,
              }),
            ),
          );
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (error) {
        console.error(
          "Conversation loading error:",
          error,
        );

        if (!cancelled) {
          setConversationId(null);
          setMessages([WELCOME_MESSAGE]);
        }
      } finally {
        if (!cancelled) {
          setLoadingConversation(false);
        }
      }
    }

    void loadLatestConversation();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // NEW CONVERSATION
  // =========================================================

  function startNewConversation() {
    if (loading || loadingConversation) {
      return;
    }

    setConversationId(null);

    setMessages([WELCOME_MESSAGE]);

    setInput("");
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function sendMessage() {
    const message = input.trim();

    if (
      !message ||
      loading ||
      loadingConversation
    ) {
      return;
    }

    // -------------------------------------------------------
    // Add user message immediately
    // -------------------------------------------------------

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    // -------------------------------------------------------
    // Clear input
    // -------------------------------------------------------

    setInput("");

    // -------------------------------------------------------
    // Start loading
    // -------------------------------------------------------

    setLoading(true);

    try {
      const response = await fetch(
        getApiUrl("/api/agent"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorBody.detail ||
            `Request failed with status ${response.status}`,
        );
      }

      const data = await response.json();

      // -----------------------------------------------------
      // Save conversation ID
      // -----------------------------------------------------

      if (
        typeof data.conversation_id === "number"
      ) {
        setConversationId(
          data.conversation_id,
        );
      }

      // -----------------------------------------------------
      // Add AI response
      // -----------------------------------------------------

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            data.response ||
            "I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      console.error(
        "AI request error:",
        error,
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: getBackendErrorMessage(
            error,
            "Sorry, I couldn't connect to the 30cent AI backend. Make sure the FastAPI server is running.",
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // SUGGESTION
  // =========================================================

  function handleSuggestion(text: string) {
    if (loading || loadingConversation) {
      return;
    }

    setInput(text);
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-[calc(100vh-1rem)] bg-[#181b18] px-4 py-6 text-[#f4f2ed] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              {/* AI Icon */}

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2a2d29] bg-[#252925]">

                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 3a7 7 0 0 0-7 7v3a4 4 0 0 0 4 4h1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M12 3a7 7 0 0 1 7 7v3a4 4 0 0 1-4 4h-1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9 21h6"
                    strokeLinecap="round"
                  />

                  <path
                    d="M12 18v3"
                    strokeLinecap="round"
                  />
                </svg>

              </div>

              {/* Title */}

              <div>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  AI Assistant
                </h1>

                <p className="mt-1 text-sm text-[#858a83]">
                  Your personal financial assistant
                </p>

              </div>

            </div>

            {/* New Chat */}

            <button
              type="button"
              onClick={startNewConversation}
              disabled={
                loading ||
                loadingConversation
              }
              className="rounded-xl border border-[#2a2d29] bg-[#20241f] px-3 py-2 text-xs text-[#858a83] transition hover:border-[#41463f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              New chat
            </button>

          </div>
        </div>

        {/* =====================================================
            CHAT CONTAINER
        ===================================================== */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#2a2d29] bg-[#1d201d]">

          {/* ===================================================
              CHAT HEADER
          =================================================== */}

          <div className="flex items-center justify-between border-b border-[#2a2d29] px-5 py-4">

            <div className="flex items-center gap-3">

              {/* Online indicator */}

              <div className="relative">

                <div className="h-2.5 w-2.5 rounded-full bg-[#b7d67b]" />

                <div className="absolute inset-0 animate-ping rounded-full bg-[#b7d67b] opacity-30" />

              </div>

              <div>

                <p className="text-sm font-medium">
                  30cent AI
                </p>

                <p className="text-xs text-[#737970]">
                  Finance • Markets • News
                </p>

              </div>

            </div>

            <div className="rounded-full border border-[#2a2d29] px-3 py-1 text-xs text-[#858a83]">
              AI
            </div>

          </div>

          {/* ===================================================
              MESSAGES
          =================================================== */}

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">

            {/* =================================================
                LOADING CONVERSATION
            ================================================= */}

            {loadingConversation ? (

              <div className="flex justify-center py-12">

                <div className="flex items-center gap-3 text-sm text-[#737970]">

                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#353934] border-t-[#b7d67b]" />

                  Loading conversation...

                </div>

              </div>

            ) : (

              <>
                {messages.map(
                  (message, index) => (

                    <div
                      key={`${index}-${message.role}`}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={
                          message.role === "user"
                            ? "max-w-[85%] rounded-2xl rounded-br-md bg-[#f4f2ed] px-4 py-3 text-sm leading-6 text-[#181b18] sm:max-w-[70%]"
                            : "max-w-[90%] rounded-2xl rounded-bl-md border border-[#2a2d29] bg-[#252925] px-4 py-3 text-sm leading-6 text-[#eceae5] sm:max-w-[75%]"
                        }
                      >

                        {/* AI label */}

                        {message.role ===
                          "assistant" && (
                          <div className="mb-2 text-xs font-medium text-[#b7d67b]">
                            30cent AI
                          </div>
                        )}

                        {/* Message */}

                        {message.role ===
                        "assistant" ? (
                          <div className="prose prose-invert max-w-none text-sm leading-6 text-[#eceae5] [&_a]:text-[#b7d67b] [&_a]:underline [&_code]:rounded [&_code]:bg-[#1a1d1a] [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#1a1d1a] [&_pre]:p-3 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold">
                            <ReactMarkdown
                              remarkPlugins={[
                                remarkGfm,
                              ]}
                              skipHtml
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}

                      </div>

                    </div>
                  ),
                )}

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                  <div className="flex justify-start">

                    <div className="rounded-2xl rounded-bl-md border border-[#2a2d29] bg-[#252925] px-4 py-3">

                      <div className="flex items-center gap-1.5">

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#858a83]" />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#858a83]"
                          style={{
                            animationDelay:
                              "120ms",
                          }}
                        />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#858a83]"
                          style={{
                            animationDelay:
                              "240ms",
                          }}
                        />

                      </div>

                    </div>

                  </div>

                )}

              </>
            )}

          </div>

          {/* ===================================================
              SUGGESTIONS + INPUT
          =================================================== */}

          <div className="border-t border-[#2a2d29] px-4 pt-4 sm:px-6">

            {/* =================================================
                SUGGESTION BUTTONS
            ================================================= */}

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "What is my current checking balance?",
                  )
                }
                disabled={
                  loading ||
                  loadingConversation
                }
                className="whitespace-nowrap rounded-full border border-[#2a2d29] bg-[#20241f] px-3 py-2 text-xs text-[#858a83] transition hover:border-[#41463f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Check my balance
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "How much did I spend recently?",
                  )
                }
                disabled={
                  loading ||
                  loadingConversation
                }
                className="whitespace-nowrap rounded-full border border-[#2a2d29] bg-[#20241f] px-3 py-2 text-xs text-[#858a83] transition hover:border-[#41463f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-40"
              >
                My spending
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "What is Nvidia's current stock price?",
                  )
                }
                disabled={
                  loading ||
                  loadingConversation
                }
                className="whitespace-nowrap rounded-full border border-[#2a2d29] bg-[#20241f] px-3 py-2 text-xs text-[#858a83] transition hover:border-[#41463f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nvidia price
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "What is the latest market news?",
                  )
                }
                disabled={
                  loading ||
                  loadingConversation
                }
                className="whitespace-nowrap rounded-full border border-[#2a2d29] bg-[#20241f] px-3 py-2 text-xs text-[#858a83] transition hover:border-[#41463f] hover:text-[#f4f2ed] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Market news
              </button>

            </div>

            {/* =================================================
                MESSAGE FORM
            ================================================= */}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
              className="mb-4 flex items-end gap-2 rounded-2xl border border-[#353934] bg-[#20241f] p-2 transition focus-within:border-[#51574f]"
            >

              {/* TEXT INPUT */}

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={(event) => {

                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    event.currentTarget.form?.requestSubmit();
                  }

                }}
                placeholder="Ask about your finances, stocks, or market news..."
                rows={1}
                disabled={
                  loading ||
                  loadingConversation
                }
                className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-[#f4f2ed] outline-none placeholder:text-[#737970] disabled:cursor-not-allowed disabled:opacity-50"
              />

              {/* SEND BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  loadingConversation ||
                  !input.trim()
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f2ed] text-[#181b18] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              >

                {loading ? (

                  /* Loading spinner */

                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >

                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2"
                      opacity="0.25"
                    />

                    <path
                      d="M21 12a9 9 0 0 1-9 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                  </svg>

                ) : (

                  /* Send icon */

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    <path
                      d="M22 2 11 13"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="m22 2-7 20-4-9-9-4Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  </svg>

                )}

              </button>

            </form>

            {/* FOOTER */}

            <p className="pb-4 text-center text-[11px] text-[#5f645e]">
              AI responses are generated from your connected
              financial data, market data, and news.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}