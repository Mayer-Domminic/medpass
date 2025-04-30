"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Sidebar from '@/components/navbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  sender: "user" | "assistant" | "bot" | "flash";
  content: string;
  timestamp: string;
}

interface ConversationSummary {
  conversationid: number;
  title: string;
  updatedat: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
  });

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [chatTitle, setChatTitle] = useState("New Conversation");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBase = `${process.env.NEXT_PUBLIC_API_URL}/gemini/chat`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showHistory && session?.accessToken) {
      fetch(`${apiBase}/history?active_only=true`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then(res => {
          if (!res.ok) {
            return Promise.reject(res.status);
          }
          return res.json();
        })
        .then(data => {
          setHistory(data); // Store the fetched data in state
        })
        .catch(error => {
          console.error("Error fetching history:", error);
        });
    }
  }, [showHistory, session?.accessToken]);

  const startNewChat = async () => {
    setConversationId(null);
    setMessages([]);
    setChatTitle("New Conversation");
  };

  const loadChatHistory = async (conversationId: number) => {
    setConversationId(conversationId);
    const res = await fetch(`${apiBase}/${conversationId}/history`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session?.accessToken}`,
      },
    });
    if (res.ok) {
      const conversation = await res.json();
      setMessages(conversation.messages);
      setChatTitle(conversation.title);
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !session?.accessToken) return;

    // Add user message locally
    const userMsg: Message = { sender: "user", content: draft, timestamp: new Date().toISOString() };
    setMessages(ms => [...ms, userMsg]);
    setDraft("");
    setIsLoading(true);

    try {
      if (conversationId === null) {
        // Start new conversation
        const res = await fetch(apiBase, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ content: draft, sender_type: "user", metadata: {} }),
        });
        if (!res.ok) throw new Error(`Failed to start chat: ${res.status}`);
        const data = await res.json();
        if (data.conversation?.conversation_id) {
          setConversationId(data.conversation.conversation_id);
          setChatTitle(data.conversation.title || draft);
          const assistantMsg: Message = {
            sender: "assistant",
            content: data.model_response.content,
            timestamp: data.model_response.timestamp,
          };
          setMessages(ms => [...ms, assistantMsg]);
        } else {
          console.error("Conversation ID missing:", data);
        }
      } else {
        // Continue existing conversation
        const res = await fetch(`${apiBase}/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ content: draft, sender_type: "user", metadata: {} }),
        });
        if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
        const data = await res.json();
        const assistantMsg: Message = {
          sender: "assistant",
          content: data.content,
          timestamp: data.timestamp,
        };
        setMessages(ms => [...ms, assistantMsg]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeString = (ts: string, sender: "user" | "assistant") => {
    const date = new Date(ts);
    if (sender === "assistant") date.setHours(date.getHours() + 5);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to render the correct sender name
  const renderSender = (sender: string) => {
    if (sender === "bot" || sender === "flash") {
      return "Medpass AI Tutor"; 
    }
    return sender === "user" ? "You" : "Medpass AI Tutor";
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[72px]">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#151b2c]">
          <h1 className="text-2xl font-bold text-gray-100">Medpass AI Mentor</h1>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={startNewChat}>New Chat</Button>
            <Button size="sm" onClick={() => setShowHistory(prev => !prev)}>
              {showHistory ? "Hide History" : "Show History"}
            </Button>
            <span className="text-base text-white bg-gray-800 px-4 py-1 rounded-full truncate max-w-xs">
              {chatTitle}
            </span>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden gap-4">
          {showHistory && (
            <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-auto">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">Conversations</h2>
              {history.length === 0 ? (
                <div className="text-gray-500 italic">No conversations yet</div>
              ) : (
                history.map(h => (
                  <div
                    key={h.conversationid}
                    className="p-2 mb-1 rounded hover:bg-gray-700 cursor-pointer text-white"
                    onClick={() => {
                      loadChatHistory(h.conversationid);
                    }}
                  >
                    <div className="truncate">{h.title}</div>
                    <div className="text-xs text-gray-400">{new Date(h.updatedat).toLocaleString()}</div>
                  </div>
                ))
              )}
            </aside>
          )}
          <div className="flex-1">
            <div className="container mx-auto py-6">
              <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 px-6 py-4">
                    <div className="flex flex-col space-y-6 pb-4">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-3xl p-4 rounded-lg shadow-lg ${m.sender === "user" ? "bg-blue-600 text-white" : "bg-[#1e293b] border border-gray-700 text-white"}`}>
                            <div
                              className="mb-2 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: m.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/\n/g, '<br/>'),
                              }}
                            />
                            <div className={`text-xs flex justify-between ${m.sender === "user" ? "text-blue-100" : "text-gray-400"}`}> 
                              <span>{getTimeString(m.timestamp, m.sender)}</span>
                              <span className="ml-2 px-2 py-0.5 rounded-full uppercase bg-gray-700 text-gray-300 text-[10px]">
                                {renderSender(m.sendertype)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#1e293b] border border-gray-700 text-white p-4 rounded-lg shadow-lg max-w-xs">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[0,300,600].map(delay => (
                                  <div key={delay} className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                ))}
                              </div>
                              <p className="text-sm text-gray-300">AI is thinking...</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <form onSubmit={sendMessage} className="border-t border-gray-700 bg-[#1e293b] p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-1 bg-gray-900 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        placeholder="Type a message…"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                      />
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!draft.trim() || isLoading}>
                        {isLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
