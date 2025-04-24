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
        let code = generateCode();
        let existingCostume = await this.costumeModel.findOne({ code }).exec();
        while (existingCostume) {
            code = generateCode();
            existingCostume = await this.costumeModel.findOne({ code }).exec();
        }
        return code;
    }

    async create(createCostumeDto: CreateCostumeDto): Promise<Costume> {
        console.log("🚀 ~ CostumesService ~ create ~ createCostumeDto:", createCostumeDto)
        this.logger.log(`Creating new costume: ${createCostumeDto.name}`);
        if (!createCostumeDto.code) {
            createCostumeDto.code = await this.generateUniqueCode();
            this.logger.log(`Generated unique code: ${createCostumeDto.code}`);
        } else {
            const existingCostume = await this.costumeModel.findOne({ code: createCostumeDto.code }).exec();
            if (existingCostume) {
                this.logger.warn(`Attempted to create costume with existing code: ${createCostumeDto.code}`);
                throw new ConflictException(`Costume with code ${createCostumeDto.code} already exists`);
            }
        }
        await this.categoriesService.findOne(createCostumeDto.categoryId);

        try {
            const createdCostume = new this.costumeModel(createCostumeDto);
            const savedCostume = await createdCostume.save();
            this.logger.log(`Created costume with ID: ${savedCostume._id}`);
            return savedCostume;
        } catch (error) {
            this.logger.error(`Failed to create costume: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(filterDto: CostumeFilterDto): Promise<{ items: Costume[]; total: number; page: number; limit: number }> {
        console.log("🚀 ~ CostumesService ~ findAll ~ filterDto:", filterDto)
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

    async findOne(id: string): Promise<Costume> {
        let costume;
        try {
            costume = await this.costumeModel.findById(id).populate('categoryId').exec();
        } catch (error) {
            this.logger.error(`Error finding costume: ${error.message}`);
            throw new NotFoundException(`Costume with ID ${id} not found`);
        }

        if (!costume) {
            this.logger.warn(`Costume with ID ${id} not found`);
            throw new NotFoundException(`Costume with ID ${id} not found`);
        }

        return costume;
    }

    async findByCode(code: string): Promise<Costume> {
        const costume = await this.costumeModel.findOne({ code }).populate('categoryId').exec();

        if (!costume) {
            this.logger.warn(`Costume with code ${code} not found`);
            throw new NotFoundException(`Costume with code ${code} not found`);
        }

        return costume;
    }

    async update(id: string, updateCostumeDto: UpdateCostumeDto): Promise<Costume> {
        console.log("🚀 ~ CostumesService ~ update ~ updateCostumeDto:", updateCostumeDto)
        this.logger.log(`Updating costume with ID: ${id}`);
        const costume = await this.findOne(id);
        if (updateCostumeDto.code && updateCostumeDto.code !== costume.code) {
            const existingWithCode = await this.costumeModel.findOne({ code: updateCostumeDto.code }).exec();
            if (existingWithCode) {
                this.logger.warn(`Attempted to update costume with existing code: ${updateCostumeDto.code}`);
                throw new ConflictException(`Costume with code ${updateCostumeDto.code} already exists`);
            }
        }
        if (updateCostumeDto.categoryId) {
            await this.categoriesService.findOne(updateCostumeDto.categoryId);
        }
        if (updateCostumeDto.quantityAvailable !== undefined &&
            costume.quantityRented > 0 &&
            updateCostumeDto.quantityAvailable + costume.quantityRented < costume.quantityAvailable + costume.quantityRented) {
            throw new BadRequestException('Cannot decrease total quantity below number of rented items');
        }
        try {
            const updatedCostume = await this.costumeModel
                .findByIdAndUpdate(id, updateCostumeDto, { new: true })
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

        return this.costumeModel.findByIdAndUpdate(
            id,
            {
                quantityAvailable: newAvailable,
                quantityRented: newRented,
                status: newStatus
            },
            { new: true }
        ).exec();
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
} 