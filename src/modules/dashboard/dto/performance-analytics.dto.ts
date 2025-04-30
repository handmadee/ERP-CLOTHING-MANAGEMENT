import { ApiProperty } from '@nestjs/swagger';

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