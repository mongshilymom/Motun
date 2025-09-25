import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import SearchBar from "@/components/search-bar";
import ProductCard from "@/components/product-card";
import BottomNavigation from "@/components/bottom-navigation";
import type { ItemWithDetails, Category } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: items = [], isLoading } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items", { 
      categoryId: selectedCategory, 
      search: searchQuery,
      regionCode: "성수동" // TODO: Get from user location
    }],
  });

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <Header />
      
      <SearchBar 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Product Grid */}
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
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
            <h3 className="font-medium mb-2">등록된 상품이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">첫 번째 상품을 등록해보세요!</p>
            <Link
              href="/add"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              data-testid="button-add-first-product"
            >
              <i className="fas fa-plus mr-2"></i>
              상품 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/add"
        className="fixed right-4 bottom-20 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors z-40"
        data-testid="button-add-product"
      >
        <i className="fas fa-plus text-xl"></i>
      </Link>

      <BottomNavigation currentPath="/" />
    </div>
  );
}
