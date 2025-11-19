import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  RATING = 'rating',
  DISTANCE = 'distance',
  NEWEST = 'newest',
  POPULAR = 'popular',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
}

export class SearchShopsDto {
  @IsOptional()
  @IsString()
  query?: string; // Full-text search

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  acceptingOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  fastDelivery?: boolean; // Has < 7 days avg completion time

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxDistance?: number; // km

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
