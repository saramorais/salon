// app/whatsapp-sim/page.tsx
"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

export default function WhatsAppSimPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", content: "Hi. Send me a message like: Do you have availability tomorrow?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/whatsapp-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        role: "bot",
        content: data.reply ?? "No reply",
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: "bot", content: "Error talking to API." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 flex flex-col gap-3">
        <h1 className="text-lg font-semibold">WhatsApp simulator</h1>
        <div className="flex-1 flex flex-col gap-2 max-h-96 overflow-y-auto border rounded p-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === "user"
                  ? "self-end bg-emerald-200 px-3 py-2 rounded-xl"
                  : "self-start bg-gray-200 px-3 py-2 rounded-xl"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start bg-gray-200 px-3 py-2 rounded-xl">
              typing...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Type a WhatsApp message..."
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-500 text-white px-4 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
