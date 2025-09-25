import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function MyPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Check authentication for protected page
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "로그인 필요",
        description: "마이페이지를 보려면 로그인해 주세요.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10 p-4">
        <h1 className="font-bold text-lg text-center">나의모툰</h1>
      </div>

      <main className="pb-24">
        {/* Profile Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="프로필"
                  className="w-full h-full rounded-full object-cover"
                  data-testid="img-profile-avatar"
                />
              ) : (
                <i className="fas fa-user text-2xl text-muted-foreground"></i>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg" data-testid="text-user-name">
                {user?.nickname || user?.email}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <i className="fas fa-map-marker-alt text-primary"></i>
                <span data-testid="text-user-location">{user?.location || "위치 미설정"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500 mb-1">
                <i className="fas fa-star text-sm"></i>
                <span className="text-sm font-medium">4.8</span>
              </div>
              <p className="text-xs text-muted-foreground">거래 24회</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="divide-y divide-border">
          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-my-products"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-box text-lg text-muted-foreground w-5"></i>
              <span>내 상품</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-purchase-history"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-shopping-cart text-lg text-muted-foreground w-5"></i>
              <span>구매내역</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-sales-history"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-receipt text-lg text-muted-foreground w-5"></i>
              <span>판매내역</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-location-settings"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-map-marker-alt text-lg text-muted-foreground w-5"></i>
              <span>동네 설정</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-notifications"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-bell text-lg text-muted-foreground w-5"></i>
              <span>알림 설정</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-customer-service"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-headset text-lg text-muted-foreground w-5"></i>
              <span>고객센터</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>

          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
            data-testid="button-settings"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-cog text-lg text-muted-foreground w-5"></i>
              <span>설정</span>
            </div>
            <i className="fas fa-chevron-right text-muted-foreground"></i>
          </button>
        </div>

        {/* Logout */}
        <div className="p-4 mt-6">
          <a
            href="/api/logout"
            className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg font-medium text-center block hover:bg-destructive/90"
            data-testid="button-logout"
          >
            로그아웃
          </a>
        </div>
      </main>

      <BottomNavigation currentPath="/my" />
    </div>
  );
}
