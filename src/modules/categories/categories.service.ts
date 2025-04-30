import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './models/category.model';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CustomLogger } from '../../common/services/logger.service';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name)
        private categoryModel: Model<CategoryDocument>,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext('CategoriesService');
    }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        this.logger.log(`Creating new category: ${createCategoryDto.name}`);

        // Check if name already exists
        const existingCategory = await this.categoryModel.findOne({ name: createCategoryDto.name }).exec();

        if (existingCategory) {
            this.logger.warn(`Attempted to create category with existing name: ${createCategoryDto.name}`);
            throw new ConflictException(`Category with name ${createCategoryDto.name} already exists`);
        }

        try {
            const createdCategory = new this.categoryModel(createCategoryDto);
            const savedCategory = await createdCategory.save();
            this.logger.log(`Created category with ID: ${savedCategory._id}`);
            return savedCategory;
        } catch (error) {
            this.logger.error(`Failed to create category: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(): Promise<any[]> {
        return this.categoryModel.aggregate([
            {
                $lookup: {
                    from: 'costumes',
                    localField: '_id',
                    foreignField: 'categoryId',
                    as: 'products',
                },
            },
            {
                $project: {
                    name: 1,
                    products: 1,
                    color: 1,
                    productCount: { $size: '$products' },
                },
            },
        ]).exec();
    }

    async findOne(id: string): Promise<Category> {
        let category;
        try {
            category = await this.categoryModel.findById(id).exec();
        } catch (error) {
            this.logger.error(`Error finding category: ${error.message}`);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        if (!category) {
            this.logger.warn(`Category with ID ${id} not found`);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        this.logger.log(`Updating category with ID: ${id}`);

        // Find the category
        await this.findOne(id);

        // If updating name, check it doesn't conflict
        if (updateCategoryDto.name) {
            const existingWithName = await this.categoryModel.findOne({
                name: updateCategoryDto.name,
                _id: { $ne: id }
            }).exec();

            if (existingWithName) {
                this.logger.warn(`Attempted to update category with existing name: ${updateCategoryDto.name}`);
                throw new ConflictException(`Category with name ${updateCategoryDto.name} already exists`);
            }
        }

        try {
            const updatedCategory = await this.categoryModel
                .findByIdAndUpdate(id, updateCategoryDto, { new: true })
                .exec();

            if (!updatedCategory) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }

            this.logger.log(`Updated category with ID: ${id}`);
            return updatedCategory;
        } catch (error) {
            this.logger.error(`Failed to update category: ${error.message}`, error.stack);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        this.logger.log(`Removing category with ID: ${id}`);

        // Check if category exists
        await this.findOne(id);

        try {
            const result = await this.categoryModel.findByIdAndDelete(id).exec();

            if (!result) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }

            this.logger.log(`Removed category with ID: ${id}`);
        } catch (error) {
            this.logger.error(`Failed to remove category: ${error.message}`, error.stack);
            throw error;
        }
    }
} 