import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import { Measurement } from '../../database/entities/measurement.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Measurement, AuditLog])],
  controllers: [MeasurementsController],
  providers: [MeasurementsService, EncryptionService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
