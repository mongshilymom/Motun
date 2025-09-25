import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface BottomNavigationProps {
  currentPath: string;
}

export default function BottomNavigation({ currentPath }: BottomNavigationProps) {
  // Get chat count (for badge)
  const { data: chats = [] } = useQuery({
    queryKey: ["/api/chats"],
    select: (data) => data || [],
  });

  const unreadChatsCount = Array.isArray(chats) ? chats.length : 0; // Simplified - in real app would check for unread messages

  const navItems = [
    {
      path: "/",
      icon: "fas fa-home",
      label: "홈",
      testId: "nav-home",
    },
    {
      path: "/search",
      icon: "fas fa-search", 
      label: "검색",
      testId: "nav-search",
    },
    {
      path: "#", // Chat list not implemented as separate page
      icon: "fas fa-comment",
      label: "채팅",
      badge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
      testId: "nav-chat",
    },
    {
      path: "/likes",
      icon: "fas fa-heart",
      label: "관심목록", 
      testId: "nav-likes",
    },
    {
      path: "/my",
      icon: "fas fa-user",
      label: "나의모툰",
      testId: "nav-my",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-background border-t border-border z-30">
      <div className="flex justify-around items-center py-2 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          
          if (item.path === "#") {
            return (
              <button
                key={item.path}
                className={`flex flex-col items-center py-2 px-4 relative transition-colors ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={item.testId}
              >
                <i className={`${item.icon} text-xl mb-1`}></i>
                <span className="text-xs">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 right-2 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          }
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center py-2 px-4 relative transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={item.testId}
            >
              <i className={`${item.icon} text-xl mb-1`}></i>
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 right-2 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
