import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    color: string;

    @Prop()
    description: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Index for text search
CategorySchema.index({ name: 'text' }); 
