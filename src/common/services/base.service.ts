import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';

export class BaseService<T extends BaseEntity> {
  constructor(private readonly model: Model<T & Document>) {}

  async create(createDto: Partial<T>): Promise<T> {
    const created = new this.model(createDto);
    return created.save();
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find({ ...filter, isActive: true }).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T> {
    const document = await this.model
      .findOne({ ...filter, isActive: true })
      .exec();
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async update(filter: FilterQuery<T>, updateDto: UpdateQuery<T>): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(
        { ...filter, isActive: true },
        { $set: { ...updateDto, updatedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document as T;
  }

  async softDelete(filter: FilterQuery<T>, deletedBy?: string): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(
        { ...filter, isActive: true },
        {
          $set: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy,
          },
        },
        { new: true },
      )
      .exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document as T;
  }

  async hardDelete(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec();
    return result.deletedCount > 0;
  }
}
