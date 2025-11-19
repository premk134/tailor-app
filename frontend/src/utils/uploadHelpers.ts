import axios from 'axios';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnail?: string;
}

export async function uploadImage(
  file: File,
  category: 'product' | 'measurement' | 'chat' | 'shop',
  token: string
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${category}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function uploadMultipleImages(
  files: File[],
  category: 'products' | 'measurements',
  token: string
): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${category}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function deleteImage(
  url: string,
  token: string
): Promise<void> {
  const parts = url.split('/');
  const filename = parts.pop();
  const category = parts.pop();

  await axios.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${category}/${filename}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export function validateImageFile(file: File): string | null {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return 'File size must be less than 5MB';
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return 'Only JPG, PNG, WebP, and GIF images are allowed';
  }

  return null;
}

export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}
