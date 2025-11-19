import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '../../../database/entities/shop.entity';

export class CreateShopDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  pincode: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty({ enum: ServiceCategory, isArray: true })
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  categories: ServiceCategory[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  workingHours?: any;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  maxConcurrentOrders?: number;
}
