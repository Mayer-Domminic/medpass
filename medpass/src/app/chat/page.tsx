"use client";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/v1";
  
  console.log(apiBase)

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    // add user message locally
    const userMsg: Message = {
      sender: "user",
      content: draft,
      timestamp: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, userMsg]);
    setDraft("");

    // first message: create new session
    if (conversationId === null) {
      const res = await fetch(`${apiBase}/gemini/chat/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 11, initial_message: draft }),
      });
      const { conversation_id } = await res.json();
      setConversationId(conversation_id);
    }

    // send to flash endpoint
    const res2 = await fetch(`${apiBase}/gemini/chat/flash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages: [
          ...messages.map((m) => ({ role: m.sender, content: m.content })),
          { role: "user", content: draft },
        ],
      }),
    });
    const botMsg = await res2.json();
    setMessages((ms) => [
      ...ms,
      {
        sender: "assistant",
        content: botMsg.content,
        timestamp: botMsg.timestamp,
      },
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-gray-100">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold">Gemini Chat</h1>
      </header>

      <ScrollArea className="flex-1 p-4 space-y-4 overflow-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-xl p-3 rounded-md ${
              m.sender === "user"
                ? "self-end bg-gray-800"
                : "self-start bg-gray-700"
            }`}
          >
            <p>{m.content}</p>
            <span className="text-xs text-gray-500">{m.timestamp}</span>
          </div>
        ))}
      </ScrollArea>

      <form
        onSubmit={sendMessage}
        className="flex items-center border-t border-gray-700 p-4"
      >
        <Input
          className="flex-1 bg-gray-800 text-gray-100"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" className="ml-2">
          Send
        </Button>
      </form>
    </div>
  );
}
