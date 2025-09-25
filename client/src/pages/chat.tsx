import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import type { ChatWithDetails } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = params?.id ? parseInt(params.id) : 0;

  const { data: chat, isLoading } = useQuery<ChatWithDetails>({
    queryKey: ["/api/chats", chatId],
    enabled: !!chatId && isAuthenticated,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        messageType: "text",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "로그인 후 메시지를 보내주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "메시지 전송에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!chatId || !isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_chat', chatId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId, isAuthenticated, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "로그인 필요",
        description: "채팅을 이용하려면 로그인해 주세요.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    sendMessageMutation.mutate(content);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">채팅 로딩중...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
          <h3 className="font-medium mb-2">채팅을 찾을 수 없습니다</h3>
          <button
            onClick={() => setLocation("/")}
            className="text-primary hover:text-primary/80"
            data-testid="button-go-home"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const otherUser = chat.sellerId === user?.id ? chat.buyer : chat.seller;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              {otherUser.profileImageUrl ? (
                <img
                  src={otherUser.profileImageUrl}
                  alt={otherUser.nickname || "사용자"}
                  className="w-full h-full rounded-full object-cover"
                  data-testid="img-chat-user-avatar"
                />
              ) : (
                <i className="fas fa-user text-muted-foreground"></i>
              )}
            </div>
            <div>
              <p className="font-medium" data-testid="text-chat-user-name">
                {otherUser.nickname || otherUser.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {otherUser.location || "위치 정보 없음"}
              </p>
            </div>
          </div>
          <button data-testid="button-chat-menu">
            <i className="fas fa-ellipsis-v text-xl text-muted-foreground"></i>
          </button>
        </div>
      </div>

      {/* Product Preview */}
      <div className="bg-muted/30 border-b border-border p-3">
        <div className="flex items-center gap-3">
          {chat.item.images && chat.item.images.length > 0 ? (
            <img 
              src={chat.item.images[0]}
              alt={chat.item.title}
              className="w-12 h-12 rounded-lg object-cover"
              data-testid="img-chat-product"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <i className="fas fa-image text-muted-foreground"></i>
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-sm" data-testid="text-chat-product-title">
              {chat.item.title}
            </p>
            <p className="text-primary font-bold" data-testid="text-chat-product-price">
              {chat.item.price.toLocaleString()}원
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
            {chat.item.status === "active" ? "판매중" : "거래완료"}
          </span>
        </div>
      </div>

      <ChatInterface
        chat={chat}
        currentUserId={user?.id || ""}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}
