import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { FileUploadService } from '../../common/services/file-upload.service';

@Module({
  controllers: [UploadsController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class UploadsModule {}
