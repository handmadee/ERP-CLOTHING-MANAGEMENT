import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../categories/models/category.model';

export type CostumeStatus = 'available' | 'maintenance';

export type CostumeDocument = Costume & Document;

@Schema({ timestamps: true })
export class Costume {
    @Prop({ unique: true })
    code: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
    categoryId: Category;

    @Prop({ required: true, type: Number })
    price: number; // Giá thuê  

    @Prop({ required: true })
    size: string; // Kích thước 

    @Prop({ required: true, enum: ['available', 'maintenance'], default: 'available' })
    status: CostumeStatus;

    @Prop()
    imageUrl: string;  // Hình ảnh sản phâm 

    @Prop({ type: [String], default: [] })
    listImageUrl: string[]; // Danh sách hình ảnh 

    @Prop({ required: true })
    description: string; // Mô tả sản phẩm 

    @Prop({ required: true, default: 1 })
    quantityAvailable: number; // Số lượng có sẵn 

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