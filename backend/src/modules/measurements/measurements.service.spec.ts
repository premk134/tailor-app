import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { Measurement, MeasurementUnit } from '../../database/entities/measurement.entity';
import { AuditLog, AuditAction, TargetType } from '../../database/entities/audit-log.entity';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let measurementRepository: jest.Mocked<Repository<Measurement>>;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let encryptionService: jest.Mocked<EncryptionService>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const measurementId = '987e6543-e21b-45f3-b123-426614174999';

  const mockMeasurementData = {
    chest: 40,
    waist: 32,
    hips: 38,
  };

  const mockMeasurement: Partial<Measurement> = {
    id: measurementId,
    userId,
    name: 'My Measurements',
    templateType: 'mens_shirt',
    unit: MeasurementUnit.CM,
    encryptedData: 'encrypted-data',
    photos: [],
    notes: 'Test notes',
    consentGiven: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsService,
        {
          provide: getRepositoryToken(Measurement),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
    measurementRepository = module.get(getRepositoryToken(Measurement));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    encryptionService = module.get(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMeasurementDto = {
      name: 'My Measurements',
      templateType: 'mens_shirt',
      unit: MeasurementUnit.CM,
      measurements: mockMeasurementData,
      notes: 'Test notes',
      consentGiven: true,
      isDefault: false,
    };

    it('should create a measurement with encrypted data', async () => {
      encryptionService.encrypt.mockReturnValue('encrypted-data');
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      measurementRepository.create.mockReturnValue(mockMeasurement as Measurement);
      measurementRepository.save.mockResolvedValue(mockMeasurement as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      const result = await service.create(userId, createDto);

      expect(encryptionService.encrypt).toHaveBeenCalledWith(mockMeasurementData);
      expect(measurementRepository.create).toHaveBeenCalled();
      expect(measurementRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: userId,
        action: AuditAction.MEASUREMENT_CREATED,
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        details: undefined,
      });
      expect(result).toHaveProperty('measurements', mockMeasurementData);
      expect(result).not.toHaveProperty('encryptedData');
    });

    it('should unset other defaults when creating a default measurement', async () => {
      const defaultCreateDto = { ...createDto, isDefault: true };

      encryptionService.encrypt.mockReturnValue('encrypted-data');
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      measurementRepository.create.mockReturnValue(mockMeasurement as Measurement);
      measurementRepository.save.mockResolvedValue(mockMeasurement as Measurement);
      measurementRepository.update.mockResolvedValue({ affected: 1 } as any);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      await service.create(userId, defaultCreateDto);

      expect(measurementRepository.update).toHaveBeenCalledWith(
        { userId, isDefault: true },
        { isDefault: false },
      );
    });

    it('should create audit log on measurement creation', async () => {
      encryptionService.encrypt.mockReturnValue('encrypted-data');
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      measurementRepository.create.mockReturnValue(mockMeasurement as Measurement);
      measurementRepository.save.mockResolvedValue(mockMeasurement as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      await service.create(userId, createDto);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: userId,
        action: AuditAction.MEASUREMENT_CREATED,
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        details: undefined,
      });
      expect(auditLogRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all measurements for a user with decrypted data', async () => {
      const measurements = [mockMeasurement, { ...mockMeasurement, id: 'different-id' }];

      measurementRepository.find.mockResolvedValue(measurements as Measurement[]);
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);

      const result = await service.findAll(userId);

      expect(measurementRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('measurements', mockMeasurementData);
      expect(result[0]).not.toHaveProperty('encryptedData');
    });

    it('should return empty array if no measurements found', async () => {
      measurementRepository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return measurement for owner', async () => {
      measurementRepository.findOne.mockResolvedValue(mockMeasurement as Measurement);
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);

      const result = await service.findOne(userId, measurementId);

      expect(measurementRepository.findOne).toHaveBeenCalledWith({
        where: { id: measurementId },
      });
      expect(result).toHaveProperty('measurements', mockMeasurementData);
      expect(auditLogRepository.create).not.toHaveBeenCalled(); // No audit log for owner
    });

    it('should throw NotFoundException if measurement not found', async () => {
      measurementRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, measurementId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create audit log when non-owner accesses with consent', async () => {
      const tailorId = 'tailor-user-id';
      const measurement = { ...mockMeasurement, consentGiven: true };

      measurementRepository.findOne.mockResolvedValue(measurement as Measurement);
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      const result = await service.findOne(userId, measurementId, tailorId);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: tailorId,
        action: AuditAction.MEASUREMENT_VIEWED,
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        details: { viewedBy: tailorId },
      });
      expect(result).toHaveProperty('measurements', mockMeasurementData);
    });

    it('should throw ForbiddenException when accessing without consent', async () => {
      const tailorId = 'tailor-user-id';
      const measurement = { ...mockMeasurement, consentGiven: false };

      measurementRepository.findOne.mockResolvedValue(measurement as Measurement);

      await expect(service.findOne(userId, measurementId, tailorId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const updateDto: Partial<CreateMeasurementDto> = {
      name: 'Updated Measurements',
      measurements: { chest: 42, waist: 34, hips: 40 },
    };

    it('should update measurement and re-encrypt data', async () => {
      measurementRepository.findOne.mockResolvedValue(mockMeasurement as Measurement);
      encryptionService.encrypt.mockReturnValue('new-encrypted-data');
      encryptionService.decrypt.mockReturnValue(updateDto.measurements);
      measurementRepository.save.mockResolvedValue({
        ...mockMeasurement,
        ...updateDto,
      } as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      const result = await service.update(userId, measurementId, updateDto);

      expect(encryptionService.encrypt).toHaveBeenCalledWith(updateDto.measurements);
      expect(measurementRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: userId,
        action: AuditAction.MEASUREMENT_UPDATED,
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        details: undefined,
      });
      expect(result).toHaveProperty('measurements');
    });

    it('should throw NotFoundException if measurement not found', async () => {
      measurementRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, measurementId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should unset other defaults when updating to default', async () => {
      const updateToDefault = { isDefault: true };

      measurementRepository.findOne.mockResolvedValue({
        ...mockMeasurement,
        isDefault: false,
      } as Measurement);
      measurementRepository.update.mockResolvedValue({ affected: 1 } as any);
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      measurementRepository.save.mockResolvedValue({
        ...mockMeasurement,
        isDefault: true,
      } as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      await service.update(userId, measurementId, updateToDefault);

      expect(measurementRepository.update).toHaveBeenCalledWith(
        { userId, isDefault: true },
        { isDefault: false },
      );
    });

    it('should not update if no measurements provided', async () => {
      const updateOnlyName = { name: 'New Name' };

      measurementRepository.findOne.mockResolvedValue(mockMeasurement as Measurement);
      encryptionService.decrypt.mockReturnValue(mockMeasurementData);
      measurementRepository.save.mockResolvedValue({
        ...mockMeasurement,
        name: 'New Name',
      } as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      await service.update(userId, measurementId, updateOnlyName);

      expect(encryptionService.encrypt).not.toHaveBeenCalled();
      expect(measurementRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete measurement and create audit log', async () => {
      measurementRepository.findOne.mockResolvedValue(mockMeasurement as Measurement);
      measurementRepository.remove.mockResolvedValue(mockMeasurement as Measurement);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      const result = await service.delete(userId, measurementId);

      expect(measurementRepository.remove).toHaveBeenCalledWith(mockMeasurement);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: userId,
        action: AuditAction.MEASUREMENT_DELETED,
        targetType: TargetType.MEASUREMENT,
        targetId: measurementId,
        details: undefined,
      });
      expect(result).toEqual({ message: 'Measurement deleted successfully' });
    });

    it('should throw NotFoundException if measurement not found', async () => {
      measurementRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(userId, measurementId)).rejects.toThrow(
        NotFoundException,
      );
      expect(measurementRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('should delete all measurements for user', async () => {
      measurementRepository.delete.mockResolvedValue({ affected: 5 } as any);
      auditLogRepository.create.mockReturnValue({} as AuditLog);
      auditLogRepository.save.mockResolvedValue({} as AuditLog);

      const result = await service.deleteAll(userId);

      expect(measurementRepository.delete).toHaveBeenCalledWith({ userId });
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        actorId: userId,
        action: AuditAction.MEASUREMENT_DELETED,
        targetType: TargetType.MEASUREMENT,
        targetId: userId,
        details: { action: 'deleted_all' },
      });
      expect(result).toEqual({ message: 'All measurements deleted successfully' });
    });
  });

  describe('getAccessLogs', () => {
    it('should return access logs for measurement', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          createdAt: new Date(),
          actor: { name: 'Tailor Shop' },
          details: { viewedBy: 'tailor-id' },
        },
      ];

      measurementRepository.findOne.mockResolvedValue(mockMeasurement as Measurement);
      auditLogRepository.find.mockResolvedValue(mockLogs as any);

      const result = await service.getAccessLogs(userId, measurementId);

      expect(measurementRepository.findOne).toHaveBeenCalledWith({
        where: { id: measurementId, userId },
      });
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: {
          targetType: TargetType.MEASUREMENT,
          targetId: measurementId,
          action: AuditAction.MEASUREMENT_VIEWED,
        },
        relations: ['actor'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('viewedBy', 'Tailor Shop');
    });

    it('should throw NotFoundException if measurement not found', async () => {
      measurementRepository.findOne.mockResolvedValue(null);

      await expect(service.getAccessLogs(userId, measurementId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
