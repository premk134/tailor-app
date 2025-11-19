import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Body,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadService } from '../../common/services/file-upload.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private fileUploadService: FileUploadService) {}

  @Post('product')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.fileUploadService.uploadFile(file, 'products');
  }

  @Post('products')
  @ApiOperation({ summary: 'Upload multiple product images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadProductImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.fileUploadService.uploadMultiple(files, 'products');
  }

  @Post('measurement')
  @ApiOperation({ summary: 'Upload measurement photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMeasurementPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.fileUploadService.uploadFile(file, 'measurements');
  }

  @Post('measurements')
  @ApiOperation({ summary: 'Upload multiple measurement photos' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMeasurementPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.fileUploadService.uploadMultiple(files, 'measurements');
  }

  @Post('chat')
  @ApiOperation({ summary: 'Upload chat attachment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.fileUploadService.uploadFile(file, 'chat');
  }

  @Post('shop')
  @ApiOperation({ summary: 'Upload shop image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.fileUploadService.uploadFile(file, 'shops');
  }

  @Delete(':category/:filename')
  @ApiOperation({ summary: 'Delete uploaded file' })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ) {
    const url = `/uploads/${category}/${filename}`;
    await this.fileUploadService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}
