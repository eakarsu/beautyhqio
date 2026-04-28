"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_OFFSET = { right: 24, bottom: 24 };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your beauty assistant. Ask me about services, prices, hours, or to help you book an appointment.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Position state for dragging the open panel
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef<{
    offsetX: number;
    offsetY: number;
    dragging: boolean;
  }>({ offsetX: 0, offsetY: 0, dragging: false });
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.dragging) return;
      setPos({
        left: e.clientX - dragRef.current.offsetX,
        top: e.clientY - dragRef.current.offsetY,
      });
    }
    function onUp() {
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      dragging: true,
    };
    document.body.style.userSelect = "none";
    if (!pos) {
      setPos({ left: rect.left, top: rect.top });
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/sms-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: next
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply =
        data.success && data.reply
          ? data.reply
          : "Sorry — I couldn't reach the assistant right now. Please try again or call the salon directly.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection error. Please check your network and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className="fixed z-50 h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        style={{ right: DEFAULT_OFFSET.right, bottom: DEFAULT_OFFSET.bottom }}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const panelStyle: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top }
    : { right: DEFAULT_OFFSET.right, bottom: DEFAULT_OFFSET.bottom };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl shadow-2xl bg-white border border-slate-200 overflow-hidden"
      style={panelStyle}
    >
      <div
        onMouseDown={handleDragStart}
        className="cursor-move bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-3 flex items-center justify-between select-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <div>
            <p className="font-semibold text-sm leading-none">Beauty Assistant</p>
            <p className="text-[11px] opacity-80 mt-0.5">Powered by AI</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="hover:bg-white/20 rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-rose-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2 text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-3 border-t border-slate-200 bg-white flex gap-2"
      >
        <Input
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className="bg-rose-600 hover:bg-rose-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
