import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { Category } from "@shared/schema";

interface SearchBarProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  categories,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <div className="p-4 bg-background border-b border-border">
      <div className="relative mb-3">
        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
        <Input
          type="text"
          placeholder="상품명, 브랜드명 검색"
          className="pl-10 pr-4 py-3 bg-muted border-0 focus:ring-2 focus:ring-primary"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus={autoFocus}
          data-testid="input-search"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
          onClick={() => onCategorySelect(null)}
          data-testid="button-category-all"
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
            onClick={() => onCategorySelect(category.id)}
            data-testid={`button-category-${category.slug}`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
