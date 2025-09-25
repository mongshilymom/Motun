import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ItemWithDetails } from "@shared/schema";

interface ProductCardProps {
  item: ItemWithDetails;
  showLikeButton?: boolean;
}

export default function ProductCard({ item, showLikeButton = true }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/likes/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/likes"] });
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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  const formatTimeAgo = (date: string | Date | null) => {
    if (!date) return "날짜 없음";
    const now = new Date();
    const itemDate = new Date(date);
    const diffMs = now.getTime() - itemDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${Math.floor(diffDays / 7)}주 전`;
  };

  return (
    <Link 
      href={`/product/${item.id}`}
      className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
      data-testid={`card-product-${item.id}`}
    >
      <div className="relative aspect-square">
        {item.images && item.images.length > 0 ? (
          <img 
            src={item.images[0]}
            alt={item.title} 
            className="w-full h-full object-cover"
            loading="lazy"
            data-testid={`img-product-${item.id}`}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <i className="fas fa-image text-2xl text-muted-foreground"></i>
          </div>
        )}
        
        {showLikeButton && (
          <button 
            className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background/90"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending}
            data-testid={`button-like-${item.id}`}
          >
            <i className={`fas fa-heart text-sm ${
              item.isLiked ? "text-accent" : "text-muted-foreground"
            }`}></i>
          </button>
        )}
        
        <div className="absolute bottom-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground">
          <i className="fas fa-eye mr-1"></i>
          <span data-testid={`text-views-${item.id}`}>{item.views || 0}</span>
        </div>
      </div>
      
      <div className="p-3">
        <h3 
          className="font-medium text-sm line-clamp-2 mb-1" 
          data-testid={`text-title-${item.id}`}
        >
          {item.title}
        </h3>
        <p 
          className="text-lg font-bold text-primary mb-1"
          data-testid={`text-price-${item.id}`}
        >
          {item.price.toLocaleString()}원
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {item.seller.location || "위치 정보 없음"} · {item.createdAt ? formatTimeAgo(item.createdAt) : "날짜 없음"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid={`text-likes-${item.id}`}>
            관심 {item._count?.likes || 0}
          </span>
          <span data-testid={`text-chats-${item.id}`}>
            채팅 {item._count?.chats || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
