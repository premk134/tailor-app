'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';
import axios from 'axios';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  category: 'products' | 'measurements' | 'chat' | 'shops';
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: string[];
  label?: string;
}

export function ImageUpload({
  onUpload,
  category,
  multiple = false,
  maxFiles = 1,
  existingImages = [],
  label = 'Upload Images',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const [previews, setPreviews] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max files
    if (images.length + files.length > maxFiles) {
      alert(`You can only upload ${maxFiles} image(s)`);
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      if (multiple) {
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', files[0]);
      }

      const endpoint = multiple
        ? `/api/uploads/${category}s`
        : `/api/uploads/${category}`;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedUrls = multiple
        ? response.data.map((img: any) => img.url)
        : [response.data.url];

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      setPreviews(newImages);
      onUpload(newImages);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image(s). Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
    onUpload(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${preview}`}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {images.length < maxFiles && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileSelect}
              className="hidden"
              id={`file-upload-${category}`}
            />
            <label htmlFor={`file-upload-${category}`}>
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {images.length === 0
                      ? label
                      : `Add More (${images.length}/${maxFiles})`}
                  </div>
                )}
              </Button>
            </label>
            {multiple && (
              <p className="mt-2 text-sm text-gray-500">
                You can upload up to {maxFiles} images. Accepted formats: JPG,
                PNG, WebP (max 5MB each)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
