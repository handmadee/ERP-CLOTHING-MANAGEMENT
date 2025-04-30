import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DashboardResponseDto, RevenueChartDto, PerformanceAnalyticsDto, TimeRange } from './dto/dashboard.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { BaseController } from 'src/common/controllers/base.controller';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard statistics including revenue, orders, customers, costumes data',
    type: DashboardResponseDto
  })
  @ApiQuery({
    name: 'timeRange',
    enum: TimeRange,
    required: false,
    description: 'Time range for dashboard statistics (default: 30days)'
  })
  @Roles(Role.ADMIN)
  async getDashboardStatistics(
    @Query('timeRange') timeRange: TimeRange = TimeRange.DAYS_30
  ) {
    const data = await this.dashboardService.getDashboardStatistics(timeRange);
    return this.success(data);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance analytics for a specific period' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed performance analytics',
    type: PerformanceAnalyticsDto
  })
  @ApiQuery({
    name: 'period',
    enum: ['week', 'month', 'year'],
    required: false,
    description: 'Period for analytics (default: month)'
  })
  @Roles(Role.ADMIN)
  async getPerformanceAnalytics(
    @Query('period') period: 'week' | 'month' | 'year' = 'month'
  ) {
    const data = await this.dashboardService.getPerformanceAnalytics(period);
    return this.success(data);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data by time period' })
  @ApiResponse({
    status: 200,
    description: 'Returns revenue chart data for the specified period',
    type: RevenueChartDto
  })
  @ApiQuery({
    name: 'period',
    enum: ['day', 'week', 'month', 'year'],
    required: false,
    description: 'Time period for chart data (default: month)'
  })
  @Roles(Role.ADMIN)
  async getRevenueChart(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month'
  ) {
    const data = await this.dashboardService.getRevenueChartData(period);
    return this.success(data);
  }
}
