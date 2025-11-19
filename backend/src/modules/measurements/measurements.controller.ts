import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('measurements')
@Controller('measurements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new measurement profile' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateMeasurementDto,
  ) {
    return this.measurementsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all measurement profiles' })
  async findAll(@CurrentUser() user: any) {
    return this.measurementsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific measurement profile' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.measurementsService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a measurement profile' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateMeasurementDto>,
  ) {
    return this.measurementsService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a measurement profile' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.measurementsService.delete(user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all measurement profiles (GDPR)' })
  async deleteAll(@CurrentUser() user: any) {
    return this.measurementsService.deleteAll(user.id);
  }

  @Get(':id/access-logs')
  @ApiOperation({ summary: 'Get access logs for a measurement' })
  async getAccessLogs(@CurrentUser() user: any, @Param('id') id: string) {
    return this.measurementsService.getAccessLogs(user.id, id);
  }
}
