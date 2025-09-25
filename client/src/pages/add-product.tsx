import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/image-upload";
import { insertItemSchema } from "@shared/schema";
import type { Category } from "@shared/schema";
import { z } from "zod";

const formSchema = insertItemSchema.extend({
  images: z.array(z.instanceof(File)).optional(),
  isNegotiable: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      categoryId: 0,
      regionCode: user?.location || "성수동",
      isNegotiable: false,
      images: [],
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "images" && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append images
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/items", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "성공",
        description: "상품이 성공적으로 등록되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "로그인 후 상품을 등록해 주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "상품 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (selectedImages.length === 0) {
      toast({
        title: "이미지 필요",
        description: "상품 이미지를 최소 1장 업로드해 주세요.",
        variant: "destructive",
      });
      return;
    }

    createItemMutation.mutate(data);
  };

  if (!isAuthenticated) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 100);
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation("/")}
            data-testid="button-close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <h1 className="font-bold text-lg">상품 등록</h1>
          <button 
            className="text-primary font-medium disabled:opacity-50"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createItemMutation.isPending}
            data-testid="button-submit"
          >
            {createItemMutation.isPending ? "등록중..." : "완료"}
          </button>
        </div>
      </div>

      <div className="p-4 pb-8">
        <Form {...form}>
          <form className="space-y-6">
            {/* Image Upload */}
            <div>
              <FormLabel className="text-base font-medium">
                사진 <span className="text-muted-foreground text-sm">(최대 10장)</span>
              </FormLabel>
              <ImageUpload
                images={selectedImages}
                onChange={setSelectedImages}
                maxImages={10}
              />
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="상품명을 입력하세요" 
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="카테고리를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>가격</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="pr-8"
                          data-testid="input-price"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          원
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isNegotiable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-negotiable"
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-muted-foreground">
                      가격제안받기
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`상품에 대한 자세한 설명을 입력하세요
- 구매시기, 사용기간
- 상품 상태
- 거래 희망 지역 등`}
                        rows={6}
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>거래지역</FormLabel>
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg mt-2">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  <span data-testid="text-location">{user?.location || "성수동"}</span>
                  <button 
                    type="button"
                    className="text-primary text-sm ml-auto"
                    data-testid="button-change-location"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
