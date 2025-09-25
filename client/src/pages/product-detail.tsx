import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ItemWithDetails } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const itemId = params?.id ? parseInt(params.id) : 0;

  const { data: item, isLoading } = useQuery<ItemWithDetails>({
    queryKey: ["/api/items", itemId],
    enabled: !!itemId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/likes/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", itemId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "로그인 후 이용해 주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "관심 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chats", {
        itemId: itemId,
        sellerId: item?.sellerId,
      });
      return res.json();
    },
    onSuccess: (chat) => {
      setLocation(`/chat/${chat.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "로그인 후 채팅을 시작해 주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "채팅 시작에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // Check authentication for protected page
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "로그인 필요",
        description: "상품 상세 정보를 보려면 로그인해 주세요.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="aspect-square bg-muted"></div>
          <div className="p-4 space-y-4">
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
          <h3 className="font-medium mb-2">상품을 찾을 수 없습니다</h3>
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

  const handleToggleLike = () => {
    likeMutation.mutate();
  };

  const handleStartChat = () => {
    if (item.sellerId === user?.id) {
      toast({
        title: "알림",
        description: "본인의 상품입니다.",
        variant: "default",
      });
      return;
    }
    chatMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div className="flex gap-3">
            <button data-testid="button-share">
              <i className="fas fa-share-alt text-xl text-muted-foreground"></i>
            </button>
            <button data-testid="button-menu">
              <i className="fas fa-ellipsis-v text-xl text-muted-foreground"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="relative">
        {item.images && item.images.length > 0 ? (
          <img 
            src={item.images[0]}
            alt={item.title} 
            className="w-full aspect-square object-cover"
            data-testid="img-product"
          />
        ) : (
          <div className="w-full aspect-square bg-muted flex items-center justify-center">
            <i className="fas fa-image text-4xl text-muted-foreground"></i>
          </div>
        )}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            1/{item.images.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Seller Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {item.seller.profileImageUrl ? (
              <img 
                src={item.seller.profileImageUrl}
                alt={item.seller.nickname || "판매자"}
                className="w-full h-full rounded-full object-cover"
                data-testid="img-seller-avatar"
              />
            ) : (
              <i className="fas fa-user text-xl text-muted-foreground"></i>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium" data-testid="text-seller-name">
              {item.seller.nickname || item.seller.email}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-seller-location">
              {item.seller.location || "위치 정보 없음"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-500 mb-1">
              <i className="fas fa-star text-sm"></i>
              <span className="text-sm font-medium">4.8</span>
            </div>
            <p className="text-xs text-muted-foreground">거래 24회</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="border-t border-border pt-4">
          <h1 className="text-xl font-bold mb-2" data-testid="text-product-title">
            {item.title}
          </h1>
          <p className="text-xs text-muted-foreground mb-2">
            {item.category.name} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "날짜 없음"}
          </p>
          <p className="text-2xl font-bold text-primary mb-4" data-testid="text-product-price">
            {item.price.toLocaleString()}원
          </p>
          
          {item.description && (
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <p className="text-sm" data-testid="text-product-description">
                {item.description}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>
              <i className="fas fa-eye mr-1"></i>
              조회 {item.views}
            </span>
            <span>
              <i className="fas fa-heart mr-1"></i>
              관심 {item._count?.likes || 0}
            </span>
            <span>
              <i className="fas fa-comment mr-1"></i>
              채팅 {item._count?.chats || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex gap-3">
          <button 
            className={`w-12 h-12 border border-border rounded-lg flex items-center justify-center ${
              item.isLiked ? 'text-accent' : 'text-muted-foreground'
            }`}
            onClick={handleToggleLike}
            disabled={likeMutation.isPending}
            data-testid="button-toggle-like"
          >
            <i className={`fas fa-heart text-xl ${item.isLiked ? 'text-accent' : ''}`}></i>
          </button>
          <button 
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            onClick={handleStartChat}
            disabled={chatMutation.isPending}
            data-testid="button-start-chat"
          >
            {chatMutation.isPending ? "시작중..." : "채팅하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
