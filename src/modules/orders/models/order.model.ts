import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/models/customer.model';
import { Costume } from '../../costumes/models/costume.model';
import { ORDER_STATUS } from '../../../common/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from 'src/modules/auth/models/account.model';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class TimelineEntry {
    @ApiProperty({ enum: ORDER_STATUS, description: 'Status of the order at this point in time' })
    @Prop({ required: true, enum: ORDER_STATUS })
    status: ORDER_STATUS;

    @ApiProperty({ description: 'Date when the status was updated' })
    @Prop({ required: true })
    date: Date;

    @ApiProperty({ description: 'Optional note about the status change', required: false })
    @Prop()
    note?: string;

}

@Schema({ _id: false })
export class OrderItem {
    @ApiProperty({ description: 'Reference to the costume', type: String })
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Costume', required: true })
    costumeId: Costume;

    @ApiProperty({ description: 'Quantity of costumes ordered', minimum: 1 })
    @Prop({ required: true, min: 1 })
    quantity: number;

    @ApiProperty({ description: 'Price per unit', minimum: 0 })
    @Prop({ required: true, min: 0 })
    price: number;

    @ApiProperty({ description: 'Subtotal for this item (price * quantity)', minimum: 0 })
    @Prop({ required: true, min: 0 })
    subtotal: number;
}

const TimelineEntrySchema = SchemaFactory.createForClass(TimelineEntry);
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
    @ApiProperty({ description: 'Unique order code', example: 'ORD-2024-001' })
    @Prop({ required: true, unique: true })
    orderCode: string;

    @ApiProperty({ description: 'Reference to the customer', type: String })
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
    customerId: Customer;

    @ApiProperty({ description: 'Reference to the account', type: String })
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
    accountId: Account;

    @ApiProperty({ description: 'Date when the order was placed' })
    @Prop({ required: true })
    orderDate: Date;

    @ApiProperty({ description: 'Date when the costumes should be returned' })
    @Prop({ required: true })
    returnDate: Date;

    @ApiProperty({ type: [OrderItem], description: 'List of items in the order' })
    @Prop({ type: [OrderItemSchema], required: true })
    items: OrderItem[];

    @ApiProperty({ description: 'Total amount of the order', minimum: 0 })
    @Prop({ required: true, min: 0 })
    total: number;

    @ApiProperty({ description: 'Deposit amount paid', minimum: 0 })
    @Prop({ required: true, min: 0 })
    deposit: number;

    @ApiProperty({ description: 'Remaining amount to be paid', minimum: 0 })
    @Prop({ required: true, min: 0 })
    remainingAmount: number;

    @ApiProperty({
        enum: ORDER_STATUS,
        default: ORDER_STATUS.PENDING,
        description: 'Current status of the order'
    })
    @Prop({ required: true, enum: ORDER_STATUS, default: ORDER_STATUS.PENDING })
    status: ORDER_STATUS;

    @ApiProperty({ description: 'Optional note about the order', required: false })
    @Prop()
    note?: string;

    @ApiProperty({ type: [TimelineEntry], description: 'History of order status changes' })
    @Prop({ type: [TimelineEntrySchema], default: [] })
    timeline: TimelineEntry[];

    @ApiProperty({ description: 'Whether the order is overdue', type: Boolean })
    isOverdue?: boolean;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt?: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ orderCode: 1 }, { unique: true });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ returnDate: 1 });
OrderSchema.index({
    orderCode: 'text',
    customerName: 'text',
    customerPhone: 'text',
    customerEmail: 'text'
});

OrderSchema.virtual('isOverdue').get(function (this: OrderDocument) {
    return this.status === ORDER_STATUS.ACTIVE && new Date() > this.returnDate;
});

OrderSchema.pre('save', function (next) {
    if (this.isNew && !this.timeline?.length) {
        this.timeline = [{
            status: this.status,
            date: new Date(),
            note: 'Order created'
        }];
    }
    next();
}); 