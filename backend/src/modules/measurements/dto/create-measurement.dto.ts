import { IsString, IsEnum, IsObject, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MeasurementTemplate, MeasurementUnit } from '../../../database/entities/measurement.entity';

export class CreateMeasurementDto {
  @ApiProperty({ example: 'My Formal Shirt Size' })
  @IsString()
  name: string;

  @ApiProperty({ enum: MeasurementTemplate })
  @IsEnum(MeasurementTemplate)
  templateType: MeasurementTemplate;

  @ApiProperty({ enum: MeasurementUnit, default: MeasurementUnit.CM })
  @IsOptional()
  @IsEnum(MeasurementUnit)
  unit?: MeasurementUnit;

  @ApiProperty({
    example: {
      chest: 38,
      waist: 32,
      shoulder: 16,
      sleeveLength: 24,
      shirtLength: 28,
      neck: 15,
    },
  })
  @IsObject()
  measurements: Record<string, number>;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
