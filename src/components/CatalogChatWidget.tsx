import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

// ── Quick-reply suggestions shown on first open ──────────────────────────────
const QUICK_REPLIES = [
  "Ver catálogo",
  "Agendar test drive",
  "Financiamiento",
  "Garantía",
];

// ── Strip markdown / WhatsApp-style formatting from bot responses ─────────────
function cleanResponse(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove backtick code blocks and inline code
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    // Remove markdown links [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove markdown headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove markdown list markers (- * •) at line start
    .replace(/^[\-\*•]\s+/gm, "")
    // Remove numbered list markers (1. 2.) at line start
    .replace(/^\d+[\.\)]\s+/gm, "")
    // Remove markdown blockquote >
    .replace(/^>\s+/gm, "")
    // Remove markdown horizontal rules
    .replace(/^[\-\*_]{3,}$/gm, "")
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    // Trim trailing whitespace on every line
    .replace(/[ \t]+$/gm, "")
    // Final trim
    .trim();
}

// ── Message type ─────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "assistant";
  content: string;
};

// ── Props ────────────────────────────────────────────────────────────────────
interface CatalogChatWidgetProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function CatalogChatWidget({ open, onClose }: CatalogChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Send a message to the chatbot API
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // Add user message immediately
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        const data = await res.json();

        if (res.ok && data.response) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: cleanResponse(data.response) },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                data.error ||
                "Lo siento, tuve un problema al procesar tu consulta. Por favor intenta de nuevo.",
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Lo siento, no pude conectarme al servicio. Verifica tu conexión e intenta de nuevo.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Handle Enter key in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Handle quick-reply button click
  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-900 border border-primary/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
      {/* ── Header ── */}
      <div className="bg-primary p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Asistente Quantum</h4>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-[10px] text-primary-foreground/90">En línea</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Cerrar chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div className="p-4 h-80 overflow-y-auto bg-slate-950 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex gap-2">
            <div className="bg-primary/20 p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border border-primary/30">
              <MessageCircle size={14} className="text-primary" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm p-3 border border-white/5 text-sm text-slate-200">
              <p className="mb-3">
                ¡Hola! Soy el asistente virtual de Quantum Motors. ¿En qué puedo ayudarte?
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="bg-slate-900 border border-primary/40 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="bg-primary/20 p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border border-primary/30">
                <MessageCircle size={14} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="bg-primary/20 p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border border-primary/30">
              <Loader2 size={14} className="text-primary animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="p-3 bg-slate-900 border-t border-white/5 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-primary p-2.5 rounded-xl text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Enviar mensaje"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
