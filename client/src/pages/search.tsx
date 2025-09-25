import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";
import ProductCard from "@/components/product-card";
import BottomNavigation from "@/components/bottom-navigation";
import type { ItemWithDetails, Category } from "@shared/schema";

export default function Search() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: items = [], isLoading } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items", { 
      categoryId: selectedCategory, 
      search: searchQuery 
    }],
    enabled: !!searchQuery || !!selectedCategory,
  });

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10 p-4">
        <h1 className="font-bold text-lg text-center">검색</h1>
      </div>

      <SearchBar 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        autoFocus={true}
      />

      {/* Results */}
      <main className="p-4 pb-24">
        {!searchQuery && !selectedCategory ? (
          <div className="text-center py-12">
            <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
            <h3 className="font-medium mb-2">상품을 검색해보세요</h3>
            <p className="text-sm text-muted-foreground">
              상품명이나 카테고리로 찾고 있는 상품을 검색할 수 있어요
            </p>
          </div>
        ) : isLoading ? (
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
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
            <h3 className="font-medium mb-2">검색 결과가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              다른 키워드로 검색해보세요
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                총 {items.length}개의 상품
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNavigation currentPath="/search" />
    </div>
  );
}
