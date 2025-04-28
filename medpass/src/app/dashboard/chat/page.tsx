"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from '@/components/navbar';
import { Card, CardContent } from "@/components/ui/card";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatTitle, setChatTitle] = useState<string>("New Conversation");
  const [isLoading, setIsLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL + "/gemini";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setIsLoading(true);

    try {
      if (conversationId === null) {
        // If Message doesn't exist create a chat
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
          
          // If a title is avaiable, use it if not just parse the first mesage
          if (data.conversation.title) {
            setChatTitle(data.conversation.title);
          } else if (draft.length > 30) {
            setChatTitle(draft.substring(0, 27) + "...");
          } else {
            setChatTitle(draft);
          }

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
        // On message after contine creating the chat
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
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      Loading...
    </div>
  );

  const getTimeString = (timestamp: string, sender: "user" | "assistant") => {
    const date = new Date(timestamp);
    
    if (sender === "assistant") {
      date.setHours(date.getHours() + 5);
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      
      <div className="pl-[72px] h-screen flex flex-col">
        <header className="p-4 border-b border-gray-700 bg-[#151b2c] flex items-center">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-100">Medpass AI Mentor</h1>
            <div className="text-base text-white bg-gray-800 px-5 py-2 rounded-full font-medium truncate max-w-md shadow-sm">
              {chatTitle}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden container mx-auto py-6">
          <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="flex flex-col space-y-6 pb-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-3xl p-4 rounded-lg shadow-lg ${
                          m.sender === "user"
                            ? "bg-[#3b82f6] bg-opacity-90 text-white"
                            : "bg-[#1e293b] border border-gray-700 text-white"
                        }`}
                      >
                        <div 
                          className="mb-2 leading-relaxed text-white" 
                          dangerouslySetInnerHTML={{ 
                            __html: m.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\n/g, '<br />')
                          }}
                        ></div>
                        <div className={`text-xs ${m.sender === "user" ? "text-blue-100" : "text-gray-400"} flex justify-between items-center`}>
                          <span>{getTimeString(m.timestamp, m.sender)}</span>
                          {m.sender === "assistant" && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-[10px] uppercase">Medpass AI Tutor - Powered by: Gemini</span>
                          )}
                          {m.sender === "user" && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-700 text-blue-100 text-[10px] uppercase">You</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* This is the loading indicator for the bot it does the three dots thing */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1e293b] border border-gray-700 text-white p-4 rounded-lg shadow-lg max-w-xs">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                          </div>
                          <p className="text-sm text-gray-300">AI is thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form
                onSubmit={sendMessage}
                className="border-t border-gray-700 bg-[#1e293b] p-4"
              >
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 bg-gray-900 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={!session?.accessToken || !draft.trim() || isLoading}
                  >
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}