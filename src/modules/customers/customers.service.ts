import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Customer, CustomerDocument } from './models/customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { generateCode } from 'src/common/helpers/generate-code.helper';
import { Logger } from '@nestjs/common';
import { MESSAGES } from 'src/common/constants/index';




@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);

    constructor(
        @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    ) { }

    private async generateCustomerCode(): Promise<string> {
        const lastCustomer = await this.customerModel
            .findOne({}, { customerCode: 1 })
            .sort({ customerCode: -1 })
            .exec();
        if (!lastCustomer) {
            return 'KH' + '000001';
        }
        const lastNumber = parseInt(lastCustomer.customerCode.substring(2));
        const nextNumber = lastNumber + 1;
        return 'KH' + nextNumber.toString().padStart(6, '0');
    }

    async findAllOrder(customerId: string) {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }
        const orderStats = await this.customerModel.aggregate([
            {
                $match: { _id: customer._id }
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'orders'
                }
            },
            {
                $project: {
                    customerCode: 1,
                    fullName: 1,
                    phone: 1,
                    totalSpent: { $sum: '$orders.total' },
                    orderStats: {
                        total: { $size: '$orders' },
                        pending: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.status', 'pending'] }
                                }
                            }
                        },
                        active: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.status', 'active'] }
                                }
                            }
                        },
                        completed: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.status', 'completed'] }
                                }
                            }
                        },
                        cancelled: {
                            $size: {
                                $filter: {
                                    input: '$orders',
                                    as: 'order',
                                    cond: { $eq: ['$$order.status', 'cancelled'] }
                                }
                            }
                        }
                    },
                    orders: {
                        $map: {
                            input: '$orders',
                            as: 'order',
                            in: {
                                orderCode: '$$order.orderCode',
                                status: '$$order.status',
                                total: '$$order.total',
                                orderDate: '$$order.orderDate',
                                returnDate: '$$order.returnDate',
                                items: '$$order.items'
                            }
                        }
                    }
                }
            }
        ]);

        if (!orderStats.length) {
            return {
                customerCode: customer.customerCode,
                fullName: customer.fullName,
                phone: customer.phone,
                totalSpent: 0,
                orderStats: {
                    total: 0,
                    pending: 0,
                    active: 0,
                    completed: 0,
                    cancelled: 0
                },
                orders: []
            };
        }

        return orderStats[0];
    }

    async findByPhone(phone: string): Promise<CustomerDocument | null> {
        return this.customerModel.findOne({ phone }).exec();
    }

    async findOrCreateCustomer(customerInfo: {
        fullName: string;
        phone: string;
        note?: string;
        address?: string;
    }): Promise<CustomerDocument> {
        let customer = await this.findByPhone(customerInfo.phone);
        if (!customer) {
            const customerCode = await this.generateCustomerCode();
            const createCustomerDto: CreateCustomerDto = {
                customerCode,
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                address: customerInfo.address || '',
                note: customerInfo.note || '',
            };
            customer = await this.create(createCustomerDto);
        }
        return customer;
    }

    async createCustomerInOrder(customerInfo: {
        fullName: string;
        phone: string;
        note?: string;
        address?: string;
    }): Promise<CustomerDocument> {
        const customer = await this.customerModel.findOneAndUpdate({
            phone: customerInfo.phone
        }, {
            $set: {
                fullName: customerInfo.fullName,
                address: customerInfo.address || '',
                note: customerInfo.note || '',
            }
        }, {
            new: true,
            upsert: true
        });
        return customer;
    }

    async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
        const customerCode = await this.generateCustomerCode();
        createCustomerDto.customerCode = customerCode;
        const existingCustomer = await this.customerModel.findOne({
            $or: [
                { phone: createCustomerDto.phone },
                { customerCode: createCustomerDto.customerCode }
            ]
        });
        if (existingCustomer) {
            throw new ConflictException('Số điện thoại hoặc mã khách hàng đã tồn tại');
        }
        const createdCustomer = new this.customerModel(createCustomerDto);
        return createdCustomer.save();
    }

    async findAll(page = 1, limit = 10, search?: string) {
        try {
            const skip = (page - 1) * limit;

            let matchQuery = {};
            if (search) {
                matchQuery = {
                    $or: [
                        { fullName: { $regex: search, $options: 'i' } },
                        { phone: { $regex: search, $options: 'i' } },
                        { customerCode: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const aggregation: PipelineStage[] = [
                {
                    $match: matchQuery
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'customerId',
                        as: 'orders'
                    }
                },
                {
                    $project: {
                        customerCode: 1,
                        fullName: 1,
                        phone: 1,
                        address: 1,
                        note: 1,
                        createdAt: 1,
                        totalSpent: { $sum: '$orders.total' },
                        orderStats: {
                            total: { $size: '$orders' },
                            pending: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'pending'] }
                                    }
                                }
                            },
                            active: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'active'] }
                                    }
                                }
                            },
                            completed: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'completed'] }
                                    }
                                }
                            },
                            cancelled: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'cancelled'] }
                                    }
                                }
                            }
                        },
                        orders: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: {
                                    orderCode: '$$order.orderCode',
                                    status: '$$order.status',
                                    total: '$$order.total',
                                    orderDate: '$$order.orderDate',
                                    returnDate: '$$order.returnDate',
                                    items: '$$order.items'
                                }
                            }
                        }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];

            const [customers, totalCount] = await Promise.all([
                this.customerModel.aggregate(aggregation),
                this.customerModel.countDocuments(matchQuery)
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: customers,
                metadata: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            this.logger.error('Lỗi khi lấy danh sách khách hàng', error);
            throw new InternalServerErrorException(MESSAGES.COMMON.INTERNAL_ERROR);
        }
    }

    async findOne(id: string): Promise<Customer> {
        const customer = await this.customerModel.findById(id);
        if (!customer) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }
        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
        if (updateCustomerDto.customerCode) {
            const existingCustomer = await this.customerModel.findOne({
                customerCode: updateCustomerDto.customerCode,
                _id: { $ne: id }
            });

            if (existingCustomer) {
                throw new ConflictException('Mã khách hàng đã tồn tại');
            }
        }

        const updatedCustomer = await this.customerModel
            .findByIdAndUpdate(id, updateCustomerDto, { new: true })
            .exec();

        if (!updatedCustomer) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }

        return updatedCustomer;
    }

    async remove(id: string): Promise<void> {
        const result = await this.customerModel.findByIdAndDelete(id);
        if (!result) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }
    }

    async getCustomerStats(): Promise<any> {
        const [totalCustomers, totalSpent, topCustomers] = await Promise.all([
            this.customerModel.countDocuments(),
            this.customerModel.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalSpent' }
                    }
                }
            ]),
            this.customerModel
                .find()
                .sort({ totalSpent: -1 })
                .limit(5)
                .select('customerCode fullName totalSpent totalOrders')
        ]);

        return {
            totalCustomers,
            totalSpent: totalSpent[0]?.total || 0,
            topCustomers
        };
    }

    async updateCustomerStats(
        customerId: string,
        stats: {
            totalOrders?: number;
            totalSpent?: number;
            successfulOrders?: number;
            canceledOrders?: number;
        }
    ) {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }
        const update: any = {};
        if (stats.totalOrders) {
            update.$inc = { ...update.$inc, totalOrders: stats.totalOrders };
        }
        if (stats.totalSpent) {
            update.$inc = { ...update.$inc, totalSpent: stats.totalSpent };
        }
        if (stats.successfulOrders) {
            update.$inc = { ...update.$inc, successfulOrders: stats.successfulOrders };
        }
        if (stats.canceledOrders) {
            update.$inc = { ...update.$inc, canceledOrders: stats.canceledOrders };
        }

        return this.customerModel
            .findByIdAndUpdate(customerId, update, { new: true })
            .exec();
    }

    async findByIds(ids: string[]): Promise<any[]> {
        return this.customerModel.find({
            _id: { $in: ids }
        }).exec();
    }

    async getCustomersWithStats(query: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        try {
            const {
                page = 1,
                limit = 10000,
                search = ''
            } = query;
            const skip = (page - 1) * limit;
            const matchStage: any = {};
            if (search) {
                matchStage.$or = [
                    { fullName: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { customerCode: { $regex: search, $options: 'i' } }
                ];
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'customerId',
                        as: 'orders'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        customerCode: 1,
                        fullName: 1,
                        phone: 1,
                        email: 1,
                        address: 1,
                        totalSpent: { $sum: '$orders.total' },
                        orderStats: {
                            total: { $size: '$orders' },
                            pending: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'pending'] }
                                    }
                                }
                            },
                            active: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'active'] }
                                    }
                                }
                            },
                            completed: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'completed'] }
                                    }
                                }
                            },
                            cancelled: {
                                $size: {
                                    $filter: {
                                        input: '$orders',
                                        as: 'order',
                                        cond: { $eq: ['$$order.status', 'cancelled'] }
                                    }
                                }
                            }
                        }
                    }
                },
                { $skip: skip },
                { $limit: parseInt(String(limit)) }
            ];

            const [customers, totalCount] = await Promise.all([
                this.customerModel.aggregate(pipeline),
                this.customerModel.countDocuments(matchStage)
            ]);

            return {
                data: customers,
                metadata: {
                    total: totalCount,
                    page: parseInt(String(page)),
                    limit: parseInt(String(limit)),
                    totalPages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            this.logger.error('Error in getCustomersWithStats:', error);
            throw new InternalServerErrorException('Lỗi khi lấy thông tin khách hàng');
        }
    }
} 
