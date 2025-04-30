import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerDocument = Customer & Document;

export enum CUSTOMER_STATUS {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class Customer {
    @Prop({ required: true, unique: true })
    customerCode: string;

    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({ required: false })
    address?: string;

    @Prop({ required: false })
    note?: string;

    @Prop({ required: true, enum: CUSTOMER_STATUS, default: CUSTOMER_STATUS.ACTIVE })
    status: CUSTOMER_STATUS;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Indexes for better query performance
CustomerSchema.index({ customerCode: 'text' });
CustomerSchema.index({ fullName: 'text' });
CustomerSchema.index({ phone: 1 });
