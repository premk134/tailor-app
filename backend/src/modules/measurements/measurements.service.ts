import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement } from '../../database/entities/measurement.entity';
import { AuditLog, AuditAction, TargetType } from '../../database/entities/audit-log.entity';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectRepository(Measurement)
    private measurementRepository: Repository<Measurement>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private encryptionService: EncryptionService,
  ) {}

  async create(userId: string, createDto: CreateMeasurementDto) {
    // Encrypt measurement data
    const encryptedData = this.encryptionService.encrypt(createDto.measurements);

    // If this is set as default, unset other defaults
    if (createDto.isDefault) {
      await this.measurementRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const measurement = this.measurementRepository.create({
      userId,
      name: createDto.name,
      templateType: createDto.templateType,
      unit: createDto.unit,
      encryptedData,
      photos: createDto.photos || [],
      notes: createDto.notes,
      consentGiven: createDto.consentGiven ?? true,
      isDefault: createDto.isDefault ?? false,
    });

    await this.measurementRepository.save(measurement);

    // Log creation
    await this.createAuditLog(
      userId,
      AuditAction.MEASUREMENT_CREATED,
      measurement.id,
    );

    return this.formatMeasurement(measurement);
  }

  async findAll(userId: string) {
    const measurements = await this.measurementRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return measurements.map((m) => this.formatMeasurement(m));
  }

  async findOne(userId: string, id: string, actorId?: string) {
    const measurement = await this.measurementRepository.findOne({
      where: { id },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    // Check access permissions
    if (measurement.userId !== userId && actorId !== userId) {
      // Tailor/shop accessing customer measurement
      if (!measurement.consentGiven) {
        throw new ForbiddenException('Customer has not given consent to view measurements');
      }

      // Log access
      await this.createAuditLog(
        actorId || userId,
        AuditAction.MEASUREMENT_VIEWED,
        measurement.id,
        { viewedBy: actorId },
      );
    }

    return this.formatMeasurement(measurement);
  }

  async update(userId: string, id: string, updateDto: Partial<CreateMeasurementDto>) {
    const measurement = await this.measurementRepository.findOne({
      where: { id, userId },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    // Update encrypted data if measurements changed
    if (updateDto.measurements) {
      measurement.encryptedData = this.encryptionService.encrypt(
        updateDto.measurements,
      );
    }

    // Update other fields
    Object.assign(measurement, {
      name: updateDto.name ?? measurement.name,
      templateType: updateDto.templateType ?? measurement.templateType,
      unit: updateDto.unit ?? measurement.unit,
      photos: updateDto.photos ?? measurement.photos,
      notes: updateDto.notes ?? measurement.notes,
      consentGiven: updateDto.consentGiven ?? measurement.consentGiven,
    });

    // Handle default flag
    if (updateDto.isDefault && !measurement.isDefault) {
      await this.measurementRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
      measurement.isDefault = true;
    }

    await this.measurementRepository.save(measurement);

    // Log update
    await this.createAuditLog(
      userId,
      AuditAction.MEASUREMENT_UPDATED,
      measurement.id,
    );

    return this.formatMeasurement(measurement);
  }

  async delete(userId: string, id: string) {
    const measurement = await this.measurementRepository.findOne({
      where: { id, userId },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    await this.measurementRepository.remove(measurement);

    // Log deletion
    await this.createAuditLog(
      userId,
      AuditAction.MEASUREMENT_DELETED,
      id,
    );

    return { message: 'Measurement deleted successfully' };
  }

  async deleteAll(userId: string) {
    await this.measurementRepository.delete({ userId });

    await this.createAuditLog(
      userId,
      AuditAction.MEASUREMENT_DELETED,
      userId,
      { action: 'deleted_all' },
    );

    return { message: 'All measurements deleted successfully' };
  }

  async getAccessLogs(userId: string, measurementId: string) {
    const measurement = await this.measurementRepository.findOne({
      where: { id: measurementId, userId },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    const logs = await this.auditLogRepository.find({
      where: {
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        action: AuditAction.MEASUREMENT_VIEWED,
      },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => ({
      id: log.id,
      viewedBy: log.actor?.name || 'Unknown',
      viewedAt: log.createdAt,
      details: log.details,
    }));
  }

  private formatMeasurement(measurement: Measurement) {
    const decryptedMeasurements = this.encryptionService.decrypt(
      measurement.encryptedData,
    );

    const { encryptedData, ...rest } = measurement;

    return {
      ...rest,
      measurements: decryptedMeasurements,
    };
  }

  private async createAuditLog(
    actorId: string,
    action: AuditAction,
    targetId: string,
    details?: Record<string, any>,
  ) {
    const log = this.auditLogRepository.create({
      actorId,
      action,
      targetType: TargetType.MEASUREMENT,
      targetId,
      details,
    });

    await this.auditLogRepository.save(log);
  }
}
