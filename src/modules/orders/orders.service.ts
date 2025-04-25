import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './models/order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { CostumesService } from '../costumes/costumes.service';
import { CustomerDocument } from '../customers/models/customer.model';
import { ORDER_STATUS } from 'src/common/constants';
import { generateCode } from 'src/common/helpers/generate-code.helper';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private readonly customersService: CustomersService,
        private readonly costumesService: CostumesService,
    ) { }

    private async generateOrderCode(): Promise<string> {
        const lastOrder = await this.orderModel
            .findOne({}, { orderCode: 1 })
            .sort({ orderCode: -1 })
            .exec();
        if (!lastOrder) {
            return generateCode('MG_', 0);
        }
        const lastNumber = parseInt(lastOrder.orderCode.split('_')[1]);
        return generateCode('MG_', lastNumber);
    }

    async create(createOrderDto: CreateOrderDto, accountId: string): Promise<Order> {
        createOrderDto.orderCode = await this.generateOrderCode();
        const customer = await this.customersService.findOrCreateCustomer({
            fullName: createOrderDto.customerName,
            phone: createOrderDto.customerPhone,
            address: createOrderDto.address
        });
        createOrderDto.customerId = customer.id;
        if (new Date(createOrderDto.returnDate) <= new Date(createOrderDto.orderDate)) {
            throw new BadRequestException('Ngày trả phải sau ngày đặt hàng');
        }
        // Validate and update costume availability
        for (const item of createOrderDto.items) {
            const costume = await this.costumesService.findOne(item.costumeId.toString());
            if (costume.quantityAvailable < item.quantity) {
                throw new BadRequestException(
                    `Trang phục ${costume.name} không đủ số lượng yêu cầu`
                );
            }
            await this.costumesService.updateQuantity(
                item.costumeId.toString(),
                -item.quantity,
                item.quantity
            );
        }
        const timeline = [{
            date: new Date(),
            status: createOrderDto.status || ORDER_STATUS.PENDING,
            note: 'Tạo đơn hàng'
        }];
        const createdOrder = new this.orderModel({
            ...createOrderDto,
            timeline,
            accountId
        });
        const savedOrder = await createdOrder.save();
        await this.customersService.updateCustomerStats(customer.id, {
            totalOrders: 1,
            totalSpent: savedOrder.total
        });

        return savedOrder;
    }

    async findAll(query: any = {}): Promise<{ data: Order[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        const skip = parseInt(String((page - 1) * limit), 10);
        const limitNum = parseInt(String(limit), 10);

        const searchRegex = new RegExp(search, 'i');

        let filter: any = {};

        if (search) {
            filter.$or = [
                { orderCode: searchRegex },
                { customerName: searchRegex },
                { customerPhone: searchRegex }
            ];
        }

        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.orderDate = {};
            if (startDate) filter.orderDate.$gte = new Date(startDate);
            if (endDate) filter.orderDate.$lte = new Date(endDate);
        }

        const [data, total] = await Promise.all([
            this.orderModel.aggregate([
                { $match: filter },
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
                    $lookup: {
                        from: 'costumes',
                        localField: 'items.costumeId',
                        foreignField: '_id',
                        as: 'costumes'
                    }
                },
                {
                    $addFields: {
                        items: {
                            $map: {
                                input: '$items',
                                as: 'item',
                                in: {
                                    $mergeObjects: [
                                        '$$item',
                                        {
                                            costume: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$costumes',
                                                            as: 'c',
                                                            cond: { $eq: ['$$c._id', '$$item.costumeId'] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        orderCode: 1,
                        customerName: '$customer.fullName',
                        customerPhone: '$customer.phone',
                        customerEmail: '$customer.email',
                        address: 1,
                        orderDate: 1,
                        returnDate: 1,
                        items: {
                            $map: {
                                input: '$items',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    costumeId: '$$item.costumeId',
                                    costumeName: '$$item.costume.name',
                                    costumeCode: '$$item.costume.code',
                                    quantity: '$$item.quantity',
                                    price: '$$item.price',
                                    subtotal: '$$item.subtotal'
                                }
                            }
                        },
                        total: 1,
                        deposit: 1,
                        remainingAmount: 1,
                        status: 1,
                        note: 1,
                        timeline: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
                { $skip: skip },
                { $limit: limitNum }
            ]),
            this.orderModel.countDocuments(filter)
        ]);

        return { data, total };
    }

    async findOne(id: string): Promise<any> {
        const order = await this.orderModel
            .findById(id)
            .populate('customerId', 'customerCode fullName phone email address')
            .populate('items.costumeId', 'code name price imageUrl quantityAvailable quantityRented')
            .populate('accountId', 'username fullName role')
            .exec();
        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }
        const today = new Date();
        const returnDate = new Date(order.returnDate);
        const daysUntilReturn = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const orderDate = new Date(order.orderDate);
        const rentalDuration = Math.ceil((returnDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));

        // Calculate payment status
        const paymentStatus = order.remainingAmount === 0 ? 'Đã thanh toán đủ' :
            order.deposit > 0 ? 'Đã đặt cọc' : 'Chưa thanh toán';

        // Calculate detailed item statistics
        const itemStats = await Promise.all(order.items.map(async (item: any) => {
            const costume = item.costumeId;
            return {
                costumeCode: costume.code,
                costumeName: costume.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                availability: {
                    total: costume.quantityAvailable + costume.quantityRented,
                    available: costume.quantityAvailable,
                    rented: costume.quantityRented,
                    percentageRented: ((costume.quantityRented / (costume.quantityAvailable + costume.quantityRented)) * 100).toFixed(2)
                }
            };
        }));

        // Get customer rental history
        const customerOrders = await this.orderModel
            .find({
                customerId: (order.customerId as any)._id,
                _id: { $ne: order._id }
            })
            .sort({ orderDate: -1 })
            .limit(5)
            .select('orderCode orderDate total status')
            .exec();

        // Prepare the enhanced response
        const enhancedOrder = {
            orderDetails: {
                ...order.toObject(),
                items: itemStats
            },
            rentalMetrics: {
                rentalDuration,
                daysUntilReturn: Math.abs(daysUntilReturn),
                isOverdue: daysUntilReturn < 0,
                status: order.status,
                daysLabel: daysUntilReturn < 0 ? 'Quá hạn' : 'Còn lại',
            },
            financialMetrics: {
                total: order.total,
                deposit: order.deposit,
                remainingAmount: order.remainingAmount,
                paymentStatus,
                paymentPercentage: ((order.deposit / order.total) * 100).toFixed(2)
            },
            customerHistory: {
                previousOrders: customerOrders,
                totalOrders: customerOrders.length + 1,
                isReturningCustomer: customerOrders.length > 0
            },
            timeline: order.timeline.map((entry: any) => ({
                ...entry.toObject(),
                formattedDate: new Date(entry.date).toLocaleString('vi-VN')
            })),
            metadata: {
                createdBy: order.accountId,
                createdAt: order.createdAt,
                lastUpdated: order.updatedAt,
                lastStatus: order.timeline[order.timeline.length - 1]
            }
        };

        return enhancedOrder;
    }

    async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
        const order = await this.orderModel.findById(id);
        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        if (updateOrderDto.orderCode && updateOrderDto.orderCode !== order.orderCode) {
            const existingOrder = await this.orderModel.findOne({
                orderCode: updateOrderDto.orderCode,
                _id: { $ne: id }
            });

            if (existingOrder) {
                throw new ConflictException('Mã đơn hàng đã tồn tại');
            }
        }
        const newStatus = updateOrderDto.status;
        if (updateOrderDto.status && newStatus !== order.status) {
            order.timeline.push({
                date: new Date(),
                status: newStatus as ORDER_STATUS,
                note: `Cập nhật trạng thái từ ${order.status} sang ${newStatus}`
            });
            if (newStatus === 'completed') {
                await this.customersService.updateCustomerStats(order.customerId.toString(), {
                    successfulOrders: 1
                });
            } else if (newStatus === 'cancelled') {
                await this.customersService.updateCustomerStats(order.customerId.toString(), {
                    canceledOrders: 1
                });

                // Return costumes to inventory if cancelled
                for (const item of order.items) {
                    await this.costumesService.updateQuantity(
                        item.costumeId.toString(),
                        item.quantity,
                        -item.quantity
                    );
                }
            }
        }

        // Update order
        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(
                id,
                { ...updateOrderDto, timeline: order.timeline },
                { new: true }
            )
            .populate('customerId', 'customerCode fullName phone email address')
            .populate('items.costumeId', 'code name price imageUrl')
            .exec();

        return updatedOrder!;
    }

    async remove(id: string): Promise<void> {
        const order = await this.orderModel.findById(id);
        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Return costumes to inventory if order is active
        if (order.status === 'active') {
            for (const item of order.items) {
                await this.costumesService.updateQuantity(
                    item.costumeId.toString(),
                    item.quantity,
                    -item.quantity
                );
            }
        }

        await this.orderModel.findByIdAndDelete(id);
    }

    async getOrderStats(query: {
        startDate?: Date;
        endDate?: Date;
        timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    } = {}): Promise<any> {
        const { startDate, endDate, timeframe = 'monthly' } = query;

        // Determine date range
        const today = new Date();
        const dateFilter: any = {};

        if (startDate || endDate) {
            dateFilter.orderDate = {};
            if (startDate) dateFilter.orderDate.$gte = new Date(startDate);
            if (endDate) dateFilter.orderDate.$lte = new Date(endDate);
        } else {
            // Default to current month if no dates provided
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            dateFilter.orderDate = {
                $gte: firstDayOfMonth,
                $lte: lastDayOfMonth
            };
        }

        const [
            orderMetrics,
            revenueMetrics,
            ordersByStatus,
            recentOrders,
            orderTrends,
            topCustomers,
            topCostumes
        ] = await Promise.all([
            // Basic Order Metrics
            this.orderModel.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        avgOrderValue: { $avg: '$total' },
                        maxOrderValue: { $max: '$total' },
                        totalDeposits: { $sum: '$deposit' },
                        totalRemaining: { $sum: '$remainingAmount' }
                    }
                }
            ]),

            // Revenue Metrics with Timeline
            this.orderModel.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$orderDate' },
                            month: { $month: '$orderDate' },
                            day: { $dayOfMonth: '$orderDate' }
                        },
                        dailyRevenue: { $sum: '$total' },
                        ordersCount: { $sum: 1 },
                        depositsCollected: { $sum: '$deposit' },
                        pendingPayments: { $sum: '$remainingAmount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]),

            // Detailed Status Breakdown
            this.orderModel.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$total' },
                        avgValue: { $avg: '$total' }
                    }
                }
            ]),

            // Recent Orders with Enhanced Details
            this.orderModel
                .find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('customerId', 'customerCode fullName phone')
                .populate('items.costumeId', 'code name price')
                .populate('accountId', 'username fullName'),

            // Order Trends Analysis
            this.orderModel.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$orderDate' },
                            month: { $month: '$orderDate' },
                            week: { $week: '$orderDate' }
                        },
                        orderCount: { $sum: 1 },
                        revenue: { $sum: '$total' },
                        avgOrderValue: { $avg: '$total' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
            ]),

            // Top Customers Analysis
            this.orderModel.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$customerId',
                        orderCount: { $sum: 1 },
                        totalSpent: { $sum: '$total' },
                        avgOrderValue: { $avg: '$total' },
                        lastOrderDate: { $max: '$orderDate' }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 5 }
            ]),

            // Top Rented Costumes
            this.orderModel.aggregate([
                { $match: dateFilter },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.costumeId',
                        rentCount: { $sum: '$items.quantity' },
                        revenue: { $sum: '$items.subtotal' },
                        avgPrice: { $avg: '$items.price' }
                    }
                },
                { $sort: { rentCount: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Process status counts
        const statusCounts = {
            pending: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0
        };

        ordersByStatus.forEach((status: any) => {
            statusCounts[status._id as keyof typeof statusCounts] = status.count;
            if (status._id !== 'cancelled') {
                statusCounts.totalRevenue += status.totalValue;
            }
        });

        // Format recent orders for display
        const formattedRecentOrders = recentOrders.map((order: any) => ({
            orderCode: order.orderCode,
            customerName: order.customerId?.fullName || 'N/A',
            customerPhone: order.customerId?.phone || 'N/A',
            orderDate: order.orderDate,
            returnDate: order.returnDate,
            status: order.status,
            total: order.total,
            deposit: order.deposit,
            remainingAmount: order.remainingAmount,
            items: order.items.length,
            createdBy: order.accountId?.fullName || 'N/A'
        }));

        // Calculate performance metrics
        const metrics = orderMetrics[0] || {
            totalOrders: 0,
            avgOrderValue: 0,
            maxOrderValue: 0,
            totalDeposits: 0,
            totalRemaining: 0
        };

        // Prepare trend data
        const trends = {
            daily: this.processRevenueTimeline(revenueMetrics, 'daily'),
            weekly: this.processOrderTrends(orderTrends, 'weekly'),
            monthly: this.processOrderTrends(orderTrends, 'monthly')
        };

        return {
            summary: {
                totalOrders: metrics.totalOrders,
                pendingOrders: statusCounts.pending,
                activeOrders: statusCounts.active,
                completedOrders: statusCounts.completed,
                cancelledOrders: statusCounts.cancelled,
                monthlyRevenue: statusCounts.totalRevenue,
                avgOrderValue: metrics.avgOrderValue,
                depositCollectionRate: (metrics.totalDeposits / statusCounts.totalRevenue * 100).toFixed(2)
            },
            performance: {
                orderCompletion: {
                    completed: statusCounts.completed,
                    total: metrics.totalOrders,
                    rate: ((statusCounts.completed / metrics.totalOrders) * 100).toFixed(2)
                },
                financials: {
                    totalRevenue: statusCounts.totalRevenue,
                    collectedAmount: metrics.totalDeposits,
                    pendingAmount: metrics.totalRemaining,
                    avgOrderValue: metrics.avgOrderValue
                },
                customerMetrics: {
                    topCustomers: await this.enrichTopCustomers(topCustomers),
                    topCostumes: await this.enrichTopCostumes(topCostumes)
                }
            },
            trends,
            recentOrders: formattedRecentOrders
        };
    }

    private async enrichTopCustomers(topCustomers: any[]) {
        const customerIds = topCustomers.map(c => c._id);
        const customers = await this.customersService.findByIds(customerIds);
        const customerMap = new Map(customers.map(c => [c._id.toString(), c]));

        return topCustomers.map(customer => ({
            customerInfo: customerMap.get(customer._id.toString()),
            orderCount: customer.orderCount,
            totalSpent: customer.totalSpent,
            avgOrderValue: customer.avgOrderValue,
            lastOrderDate: customer.lastOrderDate
        }));
    }

    private async enrichTopCostumes(topCostumes: any[]) {
        const costumeIds = topCostumes.map(c => c._id);
        const costumes = await this.costumesService.findByIds(costumeIds);
        const costumeMap = new Map(costumes.map((c: any) => [c._id.toString(), c]));

        return topCostumes.map(costume => ({
            costumeInfo: costumeMap.get(costume._id.toString()),
            rentCount: costume.rentCount,
            revenue: costume.revenue,
            avgPrice: costume.avgPrice
        }));
    }

    private processRevenueTimeline(metrics: any[], timeframe: string) {
        return metrics.map(day => ({
            date: new Date(day._id.year, day._id.month - 1, day._id.day),
            revenue: day.dailyRevenue,
            orders: day.ordersCount,
            deposits: day.depositsCollected,
            pending: day.pendingPayments
        }));
    }

    private processOrderTrends(trends: any[], timeframe: string) {
        return trends.map(trend => ({
            period: `${trend._id.year}-${trend._id.month}${timeframe === 'weekly' ? `-W${trend._id.week}` : ''}`,
            orderCount: trend.orderCount,
            revenue: trend.revenue,
            avgOrderValue: trend.avgOrderValue
        }));
    }
} 