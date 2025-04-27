"use client";
import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
  });

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL + "/gemini";

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !session?.accessToken) return;

    const userMsg: Message = {
      sender: "user",
      content: draft,
      timestamp: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, userMsg]);
    setDraft("");

    try {
      if (conversationId === null) {
        // First message -> start new chat
        const res = await fetch(`${apiBase}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            content: draft,
            sender_type: "user",
            metadata: {},
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to start chat: ${res.status}`);
        }

        const data = await res.json();
        console.log("New chat response:", data);

        if (data.conversation && data.conversation.conversation_id) {
          setConversationId(data.conversation.conversation_id);

          const assistantMsg: Message = {
            sender: "assistant",
            content: data.model_response.content,
            timestamp: data.model_response.timestamp,
          };
          setMessages((ms) => [...ms, assistantMsg]);
        } else {
          console.error("Conversation ID missing:", data);
        }
      } else {
        // Subsequent message -> continue chat
        const res = await fetch(`${apiBase}/chat/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            content: draft,
            sender_type: "user",
            metadata: {},
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to send message: ${res.status}`);
        }

        const data = await res.json();
        console.log("Existing chat response:", data);

        const assistantMsg: Message = {
          sender: "assistant",
          content: data.content,
          timestamp: data.timestamp,
        };
        setMessages((ms) => [...ms, assistantMsg]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (status === 'loading') return <div>Loading...</div>; // show loading if auth session is loading

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-gray-100">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold">Gemini Chat</h1>
      </header>

      <ScrollArea className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col space-y-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md p-4 rounded-lg shadow-md ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700"
                }`}
              >
                <p className="mb-1">{m.content}</p>
                <p className="text-xs opacity-70">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
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
        <Button type="submit" className="ml-2" disabled={!session?.accessToken}>
          Send
        </Button>
      </form>
    </div>
  );
}