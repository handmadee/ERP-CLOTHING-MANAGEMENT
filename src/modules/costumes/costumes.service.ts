import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Costume, CostumeDocument, CostumeStatus } from './models/costume.model';
import { CreateCostumeDto, UpdateCostumeDto, CostumeFilterDto } from './dto/costume.dto';
import { CustomLogger } from '../../common/services/logger.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class CostumesService {
    constructor(
        @InjectModel(Costume.name)
        private costumeModel: Model<CostumeDocument>,
        private categoriesService: CategoriesService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext('CostumesService');
    }

    private async generateUniqueCode(): Promise<string> {
        const generateCode = (): string => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'SP';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        for (let i = 0; i < 10; i++) {
            const code = generateCode();
            const existingCostume = await this.costumeModel.findOne({ code } as any).exec();
            if (!existingCostume) {
                return code;
            }
        }

        // If we couldn't generate a unique code after 10 tries, use timestamp
        const timestamp = Date.now().toString(36).toUpperCase();
        return `SP${timestamp.slice(-6)}`;
    }

    async create(createCostumeDto: CreateCostumeDto): Promise<CostumeDocument> {
        this.logger.log(`Creating new costume: ${createCostumeDto.name}`);

        // Generate code if not provided
        if (!createCostumeDto.code) {
            createCostumeDto.code = await this.generateUniqueCode();
            this.logger.log(`Generated unique code: ${createCostumeDto.code}`);
        } else {
            // Validate format if code is provided
            if (!/^SP[A-Z0-9]{6}$/.test(createCostumeDto.code)) {
                throw new BadRequestException(
                    'Mã sản phẩm phải bắt đầu bằng "SP" và theo sau là 6 ký tự chữ hoa hoặc số'
                );
            }
            // Check for duplicates
            const existingCostume = await this.costumeModel.findOne({ code: createCostumeDto.code } as any).exec();
            if (existingCostume) {
                this.logger.warn(`Attempted to create costume with existing code: ${createCostumeDto.code}`);
                throw new ConflictException(`Mã sản phẩm ${createCostumeDto.code} đã tồn tại`);
            }
        }

        // Validate category
        await this.categoriesService.findOne(createCostumeDto.categoryId);

        try {
            const createdCostume = new this.costumeModel({
                ...createCostumeDto,
                status: createCostumeDto.status || 'available',
                quantityAvailable: createCostumeDto.quantityAvailable || 1,
            });
            return await createdCostume.save();
        } catch (error) {
            this.logger.error(`Failed to create costume: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(filterDto: CostumeFilterDto): Promise<{ items: Costume[]; total: number; page: number; limit: number }> {
        const {
            code,
            name,
            categoryId,
            status,
            sortBy = 'name',
            sortOrder = 'ASC',
            page = 1,
            limit = 10
        } = filterDto;

        // Build filter conditions
        const filter: any = {};

        if (code) {
            filter.code = { $regex: code, $options: 'i' };
        }

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (categoryId) {
            filter.categoryId = new Types.ObjectId(categoryId);
        }

        if (status) {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'ASC' ? 1 : -1;

        // Execute query with pagination and populate category
        const items = await this.costumeModel.aggregate([
            { $match: filter },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    categoryId: 0
                }
            }
        ]);
        console.log("🚀 ~ CostumesService ~ findAll ~ items:", items)

        // Get total count
        const total = await this.costumeModel.countDocuments(filter).exec();

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<any> {
        let costume;
        try {
            costume = await this.costumeModel
                .findById(id)
                .populate('categoryId', 'name description')
                .exec();

            if (!costume) {
                this.logger.warn(`Costume with ID ${id} not found`);
                throw new NotFoundException(`Costume with ID ${id} not found`);
            }

            // Get rental history for this costume
            const rentalHistory = await this.costumeModel.aggregate([
                { $match: { _id: costume._id } },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'items.costumeId',
                        as: 'orderHistory'
                    }
                },
                { $unwind: '$orderHistory' },
                { $sort: { 'orderHistory.orderDate': -1 } },
                { $limit: 5 }
            ]);

            // Calculate revenue metrics
            const revenueMetrics = await this.costumeModel.aggregate([
                { $match: { _id: costume._id } },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'items.costumeId',
                        as: 'orders'
                    }
                },
                { $unwind: '$orders' },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: {
                                $reduce: {
                                    input: '$orders.items',
                                    initialValue: 0,
                                    in: {
                                        $add: [
                                            '$$value',
                                            {
                                                $cond: [
                                                    { $eq: ['$$this.costumeId', costume._id] },
                                                    { $multiply: ['$$this.price', '$$this.quantity'] },
                                                    0
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        totalRentals: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$orders.status', 'completed'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        activeRentals: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$orders.status', 'active'] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            // Get current active rentals
            const activeRentals = await this.costumeModel.aggregate([
                { $match: { _id: costume._id } },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'items.costumeId',
                        as: 'activeOrders'
                    }
                },
                { $unwind: '$activeOrders' },
                { $match: { 'activeOrders.status': 'active' } },
                {
                    $project: {
                        orderCode: '$activeOrders.orderCode',
                        customerName: '$activeOrders.customerName',
                        returnDate: '$activeOrders.returnDate',
                        quantity: {
                            $reduce: {
                                input: '$activeOrders.items',
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $cond: [
                                                { $eq: ['$$this.costumeId', costume._id] },
                                                '$$this.quantity',
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);

            // Calculate maintenance and status metrics
            const maintenanceStatus = costume.status === 'maintenance' ? {
                status: 'Đang bảo trì',
                lastMaintenance: costume.lastMaintenanceDate || 'Chưa có thông tin',
                nextMaintenance: costume.nextMaintenanceDate || 'Chưa lên lịch'
            } : {
                status: 'Đang hoạt động',
                lastMaintenance: costume.lastMaintenanceDate || 'Chưa có thông tin',
                nextMaintenance: costume.nextMaintenanceDate || 'Chưa lên lịch'
            };

            // Calculate current availability
            const currentlyRentedQuantity = activeRentals.reduce((sum, rental) => sum + rental.quantity, 0);
            const actualAvailableQuantity = costume.quantityAvailable - currentlyRentedQuantity;

            // Prepare the enhanced response
            const enhancedCostume = {
                basicInfo: {
                    ...costume.toObject(),
                    category: costume.categoryId,
                    status: costume.status === 'available' ? 'Có sẵn' : 'Đang bảo trì'
                },
                inventoryMetrics: {
                    totalQuantity: costume.quantityAvailable,
                    currentlyAvailable: actualAvailableQuantity,
                    currentlyRented: currentlyRentedQuantity,
                    utilizationRate: `${((currentlyRentedQuantity / costume.quantityAvailable) * 100).toFixed(2)}%`,
                    restockNeeded: actualAvailableQuantity < (costume.quantityAvailable * 0.2),
                    recommendedRestock: actualAvailableQuantity < (costume.quantityAvailable * 0.2) ?
                        Math.ceil(costume.quantityAvailable * 0.5) : 0
                },
                financialMetrics: {
                    currentPrice: costume.price,
                    totalRevenue: revenueMetrics[0]?.totalRevenue || 0,
                    averageRevenuePerRental: revenueMetrics[0]?.totalRevenue && revenueMetrics[0]?.totalRentals ?
                        (revenueMetrics[0].totalRevenue / revenueMetrics[0].totalRentals).toFixed(2) : 0,
                    profitabilityScore: 'Cao'
                },
                rentalMetrics: {
                    totalRentals: revenueMetrics[0]?.totalRentals || 0,
                    activeRentals: revenueMetrics[0]?.activeRentals || 0,
                    currentUtilization: `${((currentlyRentedQuantity / costume.quantityAvailable) * 100).toFixed(2)}%`,
                    popularityScore: revenueMetrics[0]?.totalRentals > 50 ? 'Cao' :
                        revenueMetrics[0]?.totalRentals > 20 ? 'Trung bình' : 'Thấp'
                },
                maintenanceInfo: maintenanceStatus,
                currentRentals: activeRentals,
                recentHistory: rentalHistory.map((record: any) => ({
                    orderCode: record.orderHistory.orderCode,
                    orderDate: record.orderHistory.orderDate,
                    returnDate: record.orderHistory.returnDate,
                    status: record.orderHistory.status
                })),
                metadata: {
                    createdAt: costume.createdAt,
                    lastUpdated: costume.updatedAt,
                    lastStatusChange: costume.lastStatusChange || costume.createdAt
                }
            };

            return enhancedCostume;

        } catch (error) {
            this.logger.error(`Error finding costume: ${error.message}`);
            throw new NotFoundException(`Costume with ID ${id} not found`);
        }
    }

    async findByCode(code: string): Promise<CostumeDocument> {
        const costume = await this.costumeModel.findOne({ code } as any).populate('categoryId').exec();

        if (!costume) {
            this.logger.warn(`Costume with code ${code} not found`);
            throw new NotFoundException(`Costume with code ${code} not found`);
        }

        return costume;
    }

    async update(id: string, updateCostumeDto: UpdateCostumeDto): Promise<CostumeDocument> {
        const costume = await this.findOne(id);
        if (updateCostumeDto.categoryId) {
            await this.categoriesService.findOne(updateCostumeDto.categoryId);
        }

        try {
            const updatedCostume = await this.costumeModel
                .findByIdAndUpdate(id, updateCostumeDto as any, { new: true })
                .populate('categoryId')
                .exec();

            if (!updatedCostume) {
                throw new NotFoundException(`Costume with ID ${id} not found`);
            }
            this.logger.log(`Updated costume with ID: ${id}`);
            return updatedCostume;
        } catch (error) {
            this.logger.error(`Failed to update costume: ${error.message}`, error.stack);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        this.logger.log(`Removing costume with ID: ${id}`);

        // Find the costume first
        const costume = await this.findOne(id);

        // Check if any items are rented
        if (costume.quantityRented > 0) {
            this.logger.warn(`Cannot delete costume with ID ${id} because ${costume.quantityRented} items are rented`);
            throw new BadRequestException(`Cannot delete costume because ${costume.quantityRented} items are currently rented`);
        }

        try {
            const result = await this.costumeModel.findByIdAndDelete(id).exec();

            if (!result) {
                throw new NotFoundException(`Costume with ID ${id} not found`);
            }

            this.logger.log(`Removed costume with ID: ${id}`);
        } catch (error) {
            this.logger.error(`Failed to remove costume: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Additional business methods
    async updateQuantity(id: string, availableDelta: number, rentedDelta: number) {
        this.logger.log(`Updating quantities for costume ID ${id}: available ${availableDelta > 0 ? '+' : ''}${availableDelta}, rented ${rentedDelta > 0 ? '+' : ''}${rentedDelta}`);
        const costume = await this.findOne(id);
        const newAvailable = costume.quantityAvailable + availableDelta;
        const newRented = costume.quantityRented + rentedDelta;
        if (newAvailable < 0) {
            throw new BadRequestException('Available quantity cannot be negative');
        }
        if (newRented < 0) {
            throw new BadRequestException('Rented quantity cannot be negative');
        }
        let newStatus = costume.status;
        if (newAvailable === 0 && newRented > 0) {
            newStatus = 'rented';
        } else if (newAvailable > 0) {
            newStatus = 'available';
        }

        const updatedCostume = await this.costumeModel.findByIdAndUpdate(
            id,
            {
                quantityAvailable: newAvailable,
                quantityRented: newRented,
                status: newStatus
            } as any,
            { new: true }
        ).exec();
        return updatedCostume;
    }

    // Reporting and analytics methods
    async getCostumesByStatus(): Promise<{ status: CostumeStatus; count: number }[]> {
        return this.costumeModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: { $add: ['$quantityAvailable', '$quantityRented'] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1
                }
            }
        ]).exec();
    }

    async getCostumesByCategory(): Promise<{ categoryId: string; categoryName: string; count: number }[]> {
        return this.costumeModel.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            { $unwind: '$categoryData' },
            {
                $group: {
                    _id: '$categoryId',
                    categoryName: { $first: '$categoryData.name' },
                    count: { $sum: { $add: ['$quantityAvailable', '$quantityRented'] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    categoryId: '$_id',
                    categoryName: 1,
                    count: 1
                }
            }
        ]).exec();
    }

    async findByIds(ids: string[]): Promise<CostumeDocument[]> {
        return this.costumeModel.find({
            _id: { $in: ids.map(id => new Types.ObjectId(id)) }
        } as any).exec();
    }

    async searchCostumes(
        searchTerm: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ items: Costume[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        const searchFilter = {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { code: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        // Execute query with pagination and populate category
        const items = await this.costumeModel.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    code: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    size: 1,
                    quantityAvailable: 1,
                    color: 1,
                    status: 1,
                    imageUrl: 1,
                    listImageUrl: 1,
                    category: {
                        _id: '$category._id',
                        name: '$category.name'
                    }
                }
            }
        ]);

        // Get total count of matching documents
        const total = await this.costumeModel.countDocuments(searchFilter).exec();

        return {
            items,
            total,
            page,
            limit
        };
    }
} 