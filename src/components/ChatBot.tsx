import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "¡Hola! Soy el asistente de rugby. Pregúntame por reglas, posiciones o tácticas." }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, sending]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pude responder.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "No pude conectar con el asistente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] max-w-[calc(100vw-2rem)] h-[420px] max-h-[70vh] flex flex-col bg-[#0F0F0F] border border-slate-700 shadow-2xl rounded-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-white font-serif">Asistente de Rugby</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed border ${
                  m.role === "user"
                    ? "bg-amber-500/10 border-amber-500/30 text-slate-100"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <p className="text-[11px] uppercase tracking-wide text-slate-400">Pensando...</p>}
            {error && <p className="text-[12px] text-red-400">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 p-3 border-t border-slate-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Pregunta sobre rugby..."
              aria-label="Pregunta sobre rugby"
              className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none text-xs"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Enviar pregunta"
              className="px-3 py-2 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar asistente de rugby" : "Abrir asistente de rugby"}
        className="w-12 h-12 flex items-center justify-center bg-amber-500 hover:bg-white text-slate-950 rounded-none border border-amber-500 shadow-lg cursor-pointer transition-all"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}
