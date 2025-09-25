import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between p-4">
        <button 
          className="flex items-center gap-2"
          data-testid="button-location"
        >
          <i className="fas fa-map-marker-alt text-primary"></i>
          <span className="font-medium" data-testid="text-user-location">
            {user?.location || "성수동"}
          </span>
          <i className="fas fa-chevron-down text-muted-foreground text-sm"></i>
        </button>
        <div className="flex items-center gap-4">
          <button 
            className="relative"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-muted-foreground"></i>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>
          <button data-testid="button-profile">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="프로필"
                className="w-8 h-8 rounded-full object-cover"
                data-testid="img-profile-avatar"
              />
            ) : (
              <i className="fas fa-user-circle text-2xl text-muted-foreground"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
