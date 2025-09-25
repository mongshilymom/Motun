import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product-card";
import BottomNavigation from "@/components/bottom-navigation";
import type { ItemWithDetails } from "@shared/schema";

export default function Likes() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: likedItems = [], isLoading } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/likes"],
    enabled: isAuthenticated,
  });

  // Check authentication for protected page
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "로그인 필요",
        description: "관심목록을 보려면 로그인해 주세요.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10 p-4">
        <h1 className="font-bold text-lg text-center">관심목록</h1>
      </div>

      {/* Content */}
      <main className="p-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-5 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : likedItems.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-heart text-4xl text-muted-foreground mb-4"></i>
            <h3 className="font-medium mb-2">관심 상품이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              마음에 드는 상품에 ♥를 눌러보세요
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                총 {likedItems.length}개의 관심상품
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {likedItems.map((item) => (
                <ProductCard 
                  key={item.id} 
                  item={item} 
                  showLikeButton={true}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNavigation currentPath="/likes" />
    </div>
  );
}
