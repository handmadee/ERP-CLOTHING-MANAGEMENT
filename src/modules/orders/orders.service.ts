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
        // Time line 
        const timeline = [{
            date: new Date(),
            status: createOrderDto.status || ORDER_STATUS.PENDING,
            note: 'Tạo đơn hàng'
        }];

        // Create order
        const createdOrder = new this.orderModel({
            ...createOrderDto,
            timeline,
            accountId
        });

        const savedOrder = await createdOrder.save();

        // Update customer stats
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

        const skip = (page - 1) * limit;
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
            this.orderModel
                .find(filter)
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit)
                .populate('customerId', 'customerCode fullName phone')
                .populate('items.costumeId', 'code name')
                .exec(),
            this.orderModel.countDocuments(filter)
        ]);

        return { data, total };
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderModel
            .findById(id)
            .populate('customerId', 'customerCode fullName phone email address')
            .populate('items.costumeId', 'code name price imageUrl')
            .exec();

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        return order;
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
    } = {}): Promise<any> {
        const { startDate, endDate } = query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter = {
                orderDate: {
                    ...(startDate && { $gte: startDate }),
                    ...(endDate && { $lte: endDate })
                }
            };
        }

        const [
            totalOrders,
            totalRevenue,
            ordersByStatus,
            recentOrders
        ] = await Promise.all([
            this.orderModel.countDocuments(dateFilter),
            this.orderModel.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            this.orderModel.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            this.orderModel
                .find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('customerId', 'customerCode fullName')
                .populate('items.costumeId', 'code name')
        ]);

        const statusCounts = {
            pending: 0,
            active: 0,
            completed: 0,
            cancelled: 0
        };

        ordersByStatus.forEach((status: any) => {
            statusCounts[status._id as keyof typeof statusCounts] = status.count;
        });

        return {
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            ordersByStatus: statusCounts,
            recentOrders
        };
    }
} 