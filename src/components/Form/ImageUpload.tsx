import { useRef } from 'react';
import { Camera, X, Plus, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    try {
      const newImages = await Promise.all(filesToRead.map(file => readFileAsDataURL(file)));
      onChange([...images, ...newImages]);
    } catch (err) {
      console.error('图片读取失败：', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleClick = () => {
    if (images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group"
          >
            <img
              src={image}
              alt={`损坏照片 ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
              {index + 1}
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleClick}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs">添加照片</span>
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        最多上传 {maxImages} 张照片，点击即可选择图片
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

interface ImageViewerProps {
  images: string[];
}

export const ImageViewer = ({ images }: ImageViewerProps) => {
  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">暂无照片</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {images.map((image, index) => (
        <div
          key={index}
          className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-shadow"
          onClick={() => window.open(image, '_blank')}
        >
          <img
            src={image}
            alt={`损坏照片 ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};
