import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { ChatWithDetails } from "@shared/schema";

interface ChatInterfaceProps {
  chat: ChatWithDetails;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatInterface({
  chat,
  currentUserId,
  onSendMessage,
  isLoading,
  messagesEndRef,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isLoading) return;
    
    onSendMessage(messageInput.trim());
    setMessageInput("");
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              대화를 시작해보세요!
            </p>
          </div>
        ) : (
          chat.messages.map((message) => {
            const isMyMessage = message.senderId === currentUserId;
            
            return (
              <div 
                key={message.id} 
                className={`flex items-start gap-2 ${
                  isMyMessage ? "justify-end" : ""
                }`}
                data-testid={`message-${message.id}`}
              >
                {!isMyMessage && (
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-xs text-muted-foreground"></i>
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[70%] ${
                  isMyMessage ? "items-end" : ""
                }`}>
                  <div className={`rounded-lg px-3 py-2 ${
                    isMyMessage 
                      ? "bg-primary text-primary-foreground chat-bubble-right" 
                      : "bg-card border border-border chat-bubble-left"
                  }`}>
                    <p className="text-sm" data-testid={`message-content-${message.id}`}>
                      {message.content}
                    </p>
                  </div>
                  <span 
                    className="text-xs text-muted-foreground mt-1"
                    data-testid={`message-time-${message.id}`}
                  >
                    {message.createdAt ? formatTime(message.createdAt) : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button 
            type="button"
            className="w-10 h-10 border border-border rounded-lg flex items-center justify-center flex-shrink-0"
            data-testid="button-attach-image"
          >
            <i className="fas fa-image text-muted-foreground"></i>
          </button>
          
          <div className="flex-1">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary"
              disabled={isLoading}
              data-testid="input-message"
            />
          </div>
          
          <button 
            type="submit"
            className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            disabled={!messageInput.trim() || isLoading}
            data-testid="button-send-message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
