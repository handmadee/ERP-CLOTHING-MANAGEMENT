import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from '../customers/customers.service';
import { CostumesService } from '../costumes/costumes.service';
import { CategoriesService } from '../categories/categories.service';
import { DashboardResponseDto, WeeklyStatisticsDto, CategoryDistributionDto, RecentOrderDto, CategoryRevenueDto, RevenueForecastDto, RevenueChartDto, RevenueChartDataDto, PerformanceAnalyticsDto, TimeRange } from './dto/dashboard.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/models/order.model';
import { Customer } from '../customers/models/customer.model';
import { Costume } from '../costumes/models/costume.model';
import { Category } from '../categories/models/category.model';
import * as moment from 'moment';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(Costume.name) private costumeModel: Model<Costume>,
        @InjectModel(Category.name) private categoryModel: Model<Category>,
        private readonly ordersService: OrdersService,
        private readonly customersService: CustomersService,
        private readonly costumesService: CostumesService,
        private readonly categoriesService: CategoriesService,
    ) { }

    async getDashboardStatistics(timeRange: TimeRange = TimeRange.DAYS_30): Promise<DashboardResponseDto> {
        // Xác định khoảng thời gian dựa trên timeRange
        const { currentStart, currentEnd, prevStart, prevEnd } = this.getTimeRangeDates(timeRange);

        // Get current and previous period orders
        const currentPeriodOrders = await this.orderModel.find({
            orderDate: { $gte: currentStart, $lte: currentEnd }
        }).exec();

        const prevPeriodOrders = await this.orderModel.find({
            orderDate: { $gte: prevStart, $lte: prevEnd }
        }).exec();

        // Calculate current period revenue
        const currentPeriodRevenue = currentPeriodOrders.reduce((sum, order) => sum + order.total, 0);
        const prevPeriodRevenue = prevPeriodOrders.reduce((sum, order) => sum + order.total, 0);

        // Calculate revenue percentage change
        const revenuePercentChange = prevPeriodRevenue === 0
            ? 100
            : parseFloat(((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100).toFixed(2));

        // Calculate orders percentage change
        const ordersPercentChange = prevPeriodOrders.length === 0
            ? 100
            : parseFloat(((currentPeriodOrders.length - prevPeriodOrders.length) / prevPeriodOrders.length * 100).toFixed(2));

        // Get customers data
        const currentPeriodCustomers = await this.customerModel.find({
            createdAt: { $gte: currentStart, $lte: currentEnd }
        }).exec();

        const prevPeriodCustomers = await this.customerModel.find({
            createdAt: { $gte: prevStart, $lte: prevEnd }
        }).exec();

        // Calculate customers percentage change
        const customersPercentChange = prevPeriodCustomers.length === 0
            ? 100
            : parseFloat(((currentPeriodCustomers.length - prevPeriodCustomers.length) / prevPeriodCustomers.length * 100).toFixed(2));

        // Get total costumes count
        const totalCostumes = await this.costumeModel.countDocuments();

        // Get weekly statistics for the past 4 weeks
        const weeklyStatistics = await this.getWeeklyStatistics();

        // Get category distribution
        const categoryDistribution = await this.getCategoryDistribution();

        // Get recent orders
        const recentOrders = await this.getRecentOrders();

        // Get category revenue
        const categoryRevenue = await this.getCategoryRevenue(timeRange);

        // Get revenue forecast
        const revenueForecast = await this.getRevenueForecast();

        return {
            totalRevenue: currentPeriodRevenue,
            revenuePercentChange,
            totalOrders: currentPeriodOrders.length,
            ordersPercentChange,
            totalCustomers: await this.customerModel.countDocuments(),
            customersPercentChange,
            totalCostumes,
            weeklyStatistics,
            categoryDistribution,
            recentOrders,
            categoryRevenue,
            revenueForecast,
        };
    }

    private getTimeRangeDates(timeRange: TimeRange) {
        const now = moment();
        let currentStart: Date;
        let currentEnd: Date = now.toDate();
        let prevStart: Date;
        let prevEnd: Date;

        // Tính toán thời gian hiện tại và thời gian trước đó để so sánh
        switch (timeRange) {
            case TimeRange.TODAY:
                currentStart = moment().startOf('day').toDate();
                prevStart = moment().subtract(1, 'days').startOf('day').toDate();
                prevEnd = moment().subtract(1, 'days').endOf('day').toDate();
                break;

            case TimeRange.YESTERDAY:
                currentStart = moment().subtract(1, 'days').startOf('day').toDate();
                currentEnd = moment().subtract(1, 'days').endOf('day').toDate();
                prevStart = moment().subtract(2, 'days').startOf('day').toDate();
                prevEnd = moment().subtract(2, 'days').endOf('day').toDate();
                break;

            case TimeRange.DAYS_7:
                currentStart = moment().subtract(7, 'days').startOf('day').toDate();
                prevStart = moment().subtract(14, 'days').startOf('day').toDate();
                prevEnd = moment().subtract(7, 'days').subtract(1, 'seconds').toDate();
                break;

            case TimeRange.DAYS_30:
                currentStart = moment().subtract(30, 'days').startOf('day').toDate();
                prevStart = moment().subtract(60, 'days').startOf('day').toDate();
                prevEnd = moment().subtract(30, 'days').subtract(1, 'seconds').toDate();
                break;

            case TimeRange.THIS_MONTH:
                currentStart = moment().startOf('month').toDate();
                prevStart = moment().subtract(1, 'months').startOf('month').toDate();
                prevEnd = moment().subtract(1, 'months').endOf('month').toDate();
                break;

            case TimeRange.LAST_MONTH:
                currentStart = moment().subtract(1, 'months').startOf('month').toDate();
                currentEnd = moment().subtract(1, 'months').endOf('month').toDate();
                prevStart = moment().subtract(2, 'months').startOf('month').toDate();
                prevEnd = moment().subtract(2, 'months').endOf('month').toDate();
                break;

            case TimeRange.THIS_YEAR:
                currentStart = moment().startOf('year').toDate();
                prevStart = moment().subtract(1, 'years').startOf('year').toDate();
                prevEnd = moment().subtract(1, 'years').endOf('year').toDate();
                break;

            case TimeRange.ALL_TIME:
                currentStart = new Date(0);
                prevStart = new Date(0);
                prevEnd = new Date(0);
                break;

            default:
                currentStart = moment().subtract(30, 'days').startOf('day').toDate();
                prevStart = moment().subtract(60, 'days').startOf('day').toDate();
                prevEnd = moment().subtract(30, 'days').subtract(1, 'seconds').toDate();
        }

        return { currentStart, currentEnd, prevStart, prevEnd };
    }

    private async getWeeklyStatistics(): Promise<WeeklyStatisticsDto[]> {
        const result: WeeklyStatisticsDto[] = [];
        const now = moment();

        for (let i = 0; i < 4; i++) {
            const weekStart = moment(now).subtract(i, 'weeks').startOf('week');
            const weekEnd = moment(weekStart).endOf('week');

            // Get orders for this week
            const weekOrders = await this.orderModel.find({
                orderDate: {
                    $gte: weekStart.toDate(),
                    $lte: weekEnd.toDate()
                }
            }).exec();

            // Calculate revenue for this week
            const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);

            // Count unique customers for this week
            const customerIds = [...new Set(weekOrders.map(order => order.customerId.toString()))];

            result.unshift({
                date: weekStart.format('DD/MM'),
                revenue: weekRevenue,
                orders: weekOrders.length,
                customers: customerIds.length
            });
        }

        return result;
    }

    private async getCategoryDistribution(): Promise<CategoryDistributionDto[]> {
        // Get categories with their product counts
        const categories = await this.categoryModel.aggregate([
            {
                $lookup: {
                    from: 'costumes',
                    localField: '_id',
                    foreignField: 'categoryId',
                    as: 'products'
                }
            },
            {
                $project: {
                    name: 1,
                    color: 1,
                    productCount: { $size: '$products' }
                }
            }
        ]).exec();

        // Calculate total products
        const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

        // Calculate percentage for each category
        return categories.map(category => ({
            name: category.name,
            color: category.color,
            productCount: category.productCount,
            percentage: parseFloat(((category.productCount / totalProducts) * 100).toFixed(2))
        }));
    }

    // New methods for enhanced dashboard

    private async getRecentOrders(limit = 5): Promise<RecentOrderDto[]> {
        // Get the 5 most recent orders with customer information
        const recentOrders = await this.orderModel.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    _id: 1,
                    orderCode: 1,
                    customerName: '$customer.fullName',
                    orderDate: 1,
                    total: 1,
                    status: 1
                }
            }
        ]).exec();

        return recentOrders;
    }

    private async getCategoryRevenue(timeRange: TimeRange = TimeRange.DAYS_30): Promise<CategoryRevenueDto[]> {
        // Xác định khoảng thời gian dựa trên timeRange
        const { currentStart, currentEnd } = this.getTimeRangeDates(timeRange);

        // Aggregate order data by category
        const categoryRevenue = await this.orderModel.aggregate([
            {
                $match: {
                    orderDate: { $gte: currentStart, $lte: currentEnd }
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'costumes',
                    localField: 'items.costumeId',
                    foreignField: '_id',
                    as: 'costume'
                }
            },
            { $unwind: '$costume' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'costume.categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category._id',
                    name: { $first: '$category.name' },
                    color: { $first: '$category.color' },
                    revenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { revenue: -1 } }
        ]).exec();

        // Calculate total revenue and percentages
        const totalRevenue = categoryRevenue.reduce((sum, cat) => sum + cat.revenue, 0);

        return categoryRevenue.map(category => ({
            name: category.name,
            color: category.color,
            revenue: category.revenue,
            percentage: parseFloat(((category.revenue / totalRevenue) * 100).toFixed(2))
        }));
    }

    private async getRevenueForecast(): Promise<RevenueForecastDto[]> {
        const result: RevenueForecastDto[] = [];
        const now = moment();

        // Get historical data for the past 4 weeks
        const fourWeeksAgo = moment(now).subtract(4, 'weeks').startOf('day').toDate();
        const historicalOrders = await this.orderModel.find({
            orderDate: { $gte: fourWeeksAgo }
        }).exec();

        // Group orders by day of week to calculate average daily revenue
        const dailyAverage = new Array(7).fill(0); // Sunday to Saturday
        const dailyCount = new Array(7).fill(0);

        historicalOrders.forEach(order => {
            const orderDate = moment(order.orderDate);
            const dayOfWeek = orderDate.day();
            dailyAverage[dayOfWeek] += order.total;
            dailyCount[dayOfWeek]++;
        });

        // Calculate average for each day
        for (let i = 0; i < 7; i++) {
            dailyAverage[i] = dailyCount[i] > 0 ? dailyAverage[i] / dailyCount[i] : 0;
        }

        // Generate forecast for next 7 days
        for (let i = 1; i <= 7; i++) {
            const forecastDate = moment(now).add(i, 'days');
            const dayOfWeek = forecastDate.day();

            // Apply a growth factor based on historical trends (simplified approach)
            // For a real implementation, you might want to use more sophisticated forecasting algorithms
            const growthFactor = 1.05; // Assume 5% growth

            result.push({
                date: forecastDate.format('DD/MM'),
                revenue: Math.round(dailyAverage[dayOfWeek] * growthFactor)
            });
        }

        return result;
    }

    // Specialized dashboard views

    async getPerformanceAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<PerformanceAnalyticsDto> {
        let startDate: Date;
        const now = new Date();

        switch (period) {
            case 'week':
                startDate = moment().subtract(7, 'days').toDate();
                break;
            case 'year':
                startDate = moment().subtract(1, 'year').toDate();
                break;
            case 'month':
            default:
                startDate = moment().subtract(1, 'month').toDate();
        }

        // Get total orders in period
        const orders = await this.orderModel.find({
            orderDate: { $gte: startDate, $lte: now }
        }).exec();

        // Calculate revenue
        const revenue = orders.reduce((sum, order) => sum + order.total, 0);

        // Calculate average order value
        const averageOrderValue = orders.length > 0 ? revenue / orders.length : 0;

        // Get new customers in period
        const newCustomers = await this.customerModel.countDocuments({
            createdAt: { $gte: startDate, $lte: now }
        });

        // Get popular categories
        const popularCategories = await this.orderModel.aggregate([
            {
                $match: {
                    orderDate: { $gte: startDate, $lte: now }
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'costumes',
                    localField: 'items.costumeId',
                    foreignField: '_id',
                    as: 'costume'
                }
            },
            { $unwind: '$costume' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'costume.categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category._id',
                    name: { $first: '$category.name' },
                    color: { $first: '$category.color' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: 5 }
        ]).exec();

        return {
            period,
            revenue,
            averageOrderValue,
            orderCount: orders.length,
            newCustomers,
            popularCategories
        };
    }

    async getRevenueChartData(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<RevenueChartDto> {
        let startDate: Date;
        let format: string;
        let groupByFormat: string;
        const now = moment();

        // Define time ranges and formats based on period
        switch (period) {
            case 'day':
                startDate = moment().subtract(24, 'hours').toDate();
                format = 'HH:mm'; // Hour:Minute format
                groupByFormat = 'YYYY-MM-DD-HH'; // Group by hour
                break;
            case 'week':
                startDate = moment().subtract(7, 'days').startOf('day').toDate();
                format = 'DD/MM'; // Day/Month format
                groupByFormat = 'YYYY-MM-DD'; // Group by day
                break;
            case 'year':
                startDate = moment().subtract(12, 'months').startOf('month').toDate();
                format = 'MM/YYYY'; // Month/Year format
                groupByFormat = 'YYYY-MM'; // Group by month
                break;
            case 'month':
            default:
                startDate = moment().subtract(30, 'days').startOf('day').toDate();
                format = 'DD/MM'; // Day/Month format
                groupByFormat = 'YYYY-MM-DD'; // Group by day
        }

        // Get orders for the selected period
        const orders = await this.orderModel.find({
            orderDate: { $gte: startDate, $lte: now.toDate() }
        }).exec();

        // Group orders by date
        const revenueByDate = new Map<string, number>();

        orders.forEach(order => {
            const date = moment(order.orderDate).format(groupByFormat);
            const currentRevenue = revenueByDate.get(date) || 0;
            revenueByDate.set(date, currentRevenue + order.total);
        });

        // Convert to array and sort by date
        const sortedData = Array.from(revenueByDate.entries())
            .map(([date, revenue]) => {
                let displayDate: string;

                if (period === 'day') {
                    displayDate = moment(date, 'YYYY-MM-DD-HH').format(format);
                } else if (period === 'year') {
                    displayDate = moment(date, 'YYYY-MM').format(format);
                } else {
                    displayDate = moment(date, 'YYYY-MM-DD').format(format);
                }

                return {
                    date,
                    displayDate,
                    revenue
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        // If there's not enough data, fill in with zeros
        if (sortedData.length < 2) {
            const intervals = period === 'day' ? 24 : period === 'week' ? 7 : period === 'year' ? 12 : 30;
            const filledData: Array<{ date: string, displayDate: string, revenue: number }> = [];

            for (let i = 0; i < intervals; i++) {
                const date = period === 'day'
                    ? moment(startDate).add(i, 'hours')
                    : period === 'year'
                        ? moment(startDate).add(i, 'months')
                        : moment(startDate).add(i, 'days');

                const existingEntry = sortedData.find(item =>
                    item.date === date.format(groupByFormat)
                );

                if (existingEntry) {
                    filledData.push(existingEntry);
                } else {
                    filledData.push({
                        date: date.format(groupByFormat),
                        displayDate: date.format(format),
                        revenue: 0
                    });
                }
            }

            sortedData.length = 0;
            sortedData.push(...filledData.sort((a, b) => a.date.localeCompare(b.date)));
        }

        // Convert to chart data format
        const chartData: RevenueChartDataDto[] = sortedData.map(item => ({
            label: item.displayDate,
            value: item.revenue
        }));

        // Calculate statistics
        const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);
        const averageRevenue = totalRevenue / chartData.length || 0;

        // Find highest revenue
        let maxRevenue = 0;
        let peakRevenueLabel = '';

        chartData.forEach(item => {
            if (item.value > maxRevenue) {
                maxRevenue = item.value;
                peakRevenueLabel = item.label;
            }
        });

        return {
            period,
            data: chartData,
            totalRevenue,
            averageRevenue,
            maxRevenue,
            peakRevenueLabel
        };
    }
}
