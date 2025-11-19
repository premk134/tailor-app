import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnail?: string;
}

@Injectable()
export class FileUploadService {
  private uploadDir: string;
  private maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || 'uploads';
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'products'),
      path.join(this.uploadDir, 'measurements'),
      path.join(this.uploadDir, 'chat'),
      path.join(this.uploadDir, 'shops'),
      path.join(this.uploadDir, 'thumbnails'),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    category: 'products' | 'measurements' | 'chat' | 'shops',
  ): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file);

    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadDir, category, filename);
    const url = `/uploads/${category}/${filename}`;

    // Save original file
    await fs.promises.writeFile(filepath, file.buffer);

    // Generate thumbnail for images
    let thumbnail: string | undefined;
    if (this.isImage(file.mimetype)) {
      thumbnail = await this.generateThumbnail(file.buffer, filename);
    }

    return {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      thumbnail,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    category: 'products' | 'measurements' | 'chat' | 'shops',
  ): Promise<UploadedFile[]> {
    const uploads = await Promise.all(
      files.map((file) => this.uploadFile(file, category)),
    );
    return uploads;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const filepath = path.join(process.cwd(), url);
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
      }

      // Delete thumbnail if exists
      const thumbnailPath = url.replace(
        /\/uploads\//,
        '/uploads/thumbnails/',
      );
      const thumbnailFilepath = path.join(process.cwd(), thumbnailPath);
      if (fs.existsSync(thumbnailFilepath)) {
        await fs.promises.unlink(thumbnailFilepath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private async generateThumbnail(
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(
      this.uploadDir,
      'thumbnails',
      thumbnailFilename,
    );

    await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return `/uploads/thumbnails/${thumbnailFilename}`;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  // Optimize image (compress and resize)
  async optimizeImage(
    buffer: Buffer,
    maxWidth: number = 1920,
    quality: number = 85,
  ): Promise<Buffer> {
    return await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer();
  }
}
