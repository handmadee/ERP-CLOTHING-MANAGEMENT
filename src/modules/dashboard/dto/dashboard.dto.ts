import { ApiProperty } from '@nestjs/swagger';

export enum TimeRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  DAYS_7 = '7days',
  DAYS_30 = '30days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  ALL_TIME = 'all_time'
}

export class WeeklyStatisticsDto {
  @ApiProperty({ description: 'Date of the statistics' })
  date: string;

  @ApiProperty({ description: 'Revenue amount' })
  revenue: number;

  @ApiProperty({ description: 'Number of orders' })
  orders: number;

  @ApiProperty({ description: 'Number of customers' })
  customers: number;
}

export class CategoryDistributionDto {
  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category color' })
  color: string;

  @ApiProperty({ description: 'Number of products in this category' })
  productCount: number;

  @ApiProperty({ description: 'Percentage of total products' })
  percentage: number;
}

export class RecentOrderDto {
  @ApiProperty({ description: 'Order ID' })
  _id: string;

  @ApiProperty({ description: 'Order code' })
  orderCode: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Order date' })
  orderDate: Date;

  @ApiProperty({ description: 'Total amount' })
  total: number;

  @ApiProperty({ description: 'Order status' })
  status: string;
}

export class CategoryRevenueDto {
  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category color' })
  color: string;

  @ApiProperty({ description: 'Total revenue from this category' })
  revenue: number;

  @ApiProperty({ description: 'Percentage of total revenue' })
  percentage: number;
}

export class RevenueForecastDto {
  @ApiProperty({ description: 'Date of the forecast' })
  date: string;

  @ApiProperty({ description: 'Forecasted revenue amount' })
  revenue: number;
}

export class RevenueChartDataDto {
  @ApiProperty({ description: 'Label for the data point (date or time period)' })
  label: string;

  @ApiProperty({ description: 'Revenue value' })
  value: number;
}

export class PopularCategoryDto {
  @ApiProperty({ description: 'Category ID' })
  _id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category color' })
  color: string;

  @ApiProperty({ description: 'Number of orders' })
  orderCount: number;
}

export class PerformanceAnalyticsDto {
  @ApiProperty({ description: 'Period of analysis', enum: ['week', 'month', 'year'] })
  period: 'week' | 'month' | 'year';

  @ApiProperty({ description: 'Total revenue for the period' })
  revenue: number;

  @ApiProperty({ description: 'Average order value' })
  averageOrderValue: number;

  @ApiProperty({ description: 'Total number of orders in the period' })
  orderCount: number;

  @ApiProperty({ description: 'Number of new customers in the period' })
  newCustomers: number;

  @ApiProperty({ description: 'Most popular categories based on orders' })
  popularCategories: PopularCategoryDto[];
}

export class RevenueChartDto {
  @ApiProperty({ description: 'Type of time period', enum: ['day', 'week', 'month', 'year'] })
  period: 'day' | 'week' | 'month' | 'year';

  @ApiProperty({ description: 'Chart data showing revenue over time', type: [RevenueChartDataDto] })
  data: RevenueChartDataDto[];

  @ApiProperty({ description: 'Total revenue for the selected period' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average revenue per time unit (day/week/month)' })
  averageRevenue: number;

  @ApiProperty({ description: 'Highest revenue in the period' })
  maxRevenue: number;

  @ApiProperty({ description: 'Date or period with highest revenue' })
  peakRevenueLabel: string;
}

export class DashboardResponseDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue percentage change compared to previous month' })
  revenuePercentChange: number;

  @ApiProperty({ description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Orders percentage change compared to previous month' })
  ordersPercentChange: number;

  @ApiProperty({ description: 'Total number of customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'Customers percentage change compared to previous month' })
  customersPercentChange: number;

  @ApiProperty({ description: 'Total number of costumes in the system' })
  totalCostumes: number;

  @ApiProperty({ description: 'Weekly statistics for revenue, orders, and customers' })
  weeklyStatistics: WeeklyStatisticsDto[];

  @ApiProperty({ description: 'Category distribution statistics' })
  categoryDistribution: CategoryDistributionDto[];

  @ApiProperty({ description: 'Recent orders for display on dashboard' })
  recentOrders: RecentOrderDto[];

  @ApiProperty({ description: 'Revenue breakdown by category' })
  categoryRevenue: CategoryRevenueDto[];

  @ApiProperty({ description: 'Revenue forecast for next 7 days' })
  revenueForecast: RevenueForecastDto[];
} 