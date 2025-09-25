import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages: number;
}

export default function ImageUpload({ images, onChange, maxImages }: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = images.length + newFiles.length;

    if (totalFiles > maxImages) {
      toast({
        title: "이미지 개수 초과",
        description: `최대 ${maxImages}장까지 업로드 가능합니다.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드 가능합니다.",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "파일 크기 초과",
          description: "파일 크기는 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const getImagePreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        data-testid="input-image-upload"
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Upload Button */}
        {images.length < maxImages && (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted/50"
            }`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="button-select-images"
          >
            <i className="fas fa-camera text-2xl text-muted-foreground mb-2"></i>
            <span className="text-sm text-muted-foreground">
              {images.length}/{maxImages}
            </span>
          </div>
        )}

        {/* Image Previews */}
        {images.map((file, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={getImagePreviewUrl(file)}
              alt={`Upload preview ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              data-testid={`img-preview-${index}`}
            />
            <button
              className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
              data-testid={`button-remove-image-${index}`}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
            {index === 0 && (
              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                대표
              </div>
            )}
          </div>
        ))}

        {/* Empty slots to show grid structure */}
        {images.length < maxImages && (
          <>
            {Array.from({ length: Math.min(2, maxImages - images.length - 1) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-muted/30 rounded-lg"
              />
            ))}
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <i className="fas fa-info-circle mr-1"></i>
          첫 번째 이미지가 대표 이미지로 설정됩니다.
        </div>
      )}
    </div>
  );
}
