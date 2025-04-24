import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../categories/models/category.model';

export type CostumeStatus = 'available' | 'rented' | 'maintenance';

export type CostumeDocument = Costume & Document;

@Schema({ timestamps: true })
export class Costume {
    @Prop({ required: true, unique: true })
    code: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
    categoryId: Category;

    @Prop({ required: true, type: Number })
    price: number;

    @Prop({ required: true })
    size: string;

    @Prop({ required: true, enum: ['available', 'rented', 'maintenance'], default: 'available' })
    status: CostumeStatus;

    @Prop()
    imageUrl: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, default: 1 })
    quantityAvailable: number;

    @Prop({ required: true, default: 0 })
    quantityRented: number;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const CostumeSchema = SchemaFactory.createForClass(Costume);

// Indexes for better query performance
CostumeSchema.index({ code: 'text' });
CostumeSchema.index({ name: 'text' });
CostumeSchema.index({ categoryId: 1 });
CostumeSchema.index({ status: 1 }); 