import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';


@Schema({ timestamps: true })
export class Image {
    @ApiProperty({ description: 'Image ID', example: '60a6f75c9f546d429c3a11d8' })
    _id: Types.ObjectId;

    @Prop({ required: true })
    @ApiProperty({ description: 'Original filename', example: 'wedding_dress.jpg' })
    originalName: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Stored filename', example: '6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    filename: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'File path', example: 'uploads/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    path: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
    mimetype: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'File size in bytes', example: 1048576 })
    size: number;

    @Prop({ default: false })
    @ApiProperty({ description: 'Whether the image has been compressed', example: true })
    compressed: boolean;

    @Prop({ type: Object })
    @ApiProperty({
        description: 'Additional metadata',
        example: { width: 1920, height: 1080, optimized: true }
    })
    metadata: Record<string, any>;

    @Prop({ default: 'pending' })
    @ApiProperty({
        description: 'Processing status of the image',
        enum: ['pending', 'processing', 'completed', 'failed'],
        example: 'completed'
    })
    status: string;

    @Prop()
    @ApiProperty({ description: 'Reference to associated entity', example: '60a6f75c9f546d429c3a11e9' })
    entityId?: Types.ObjectId;

    @Prop()
    @ApiProperty({ description: 'Type of associated entity', example: 'costume' })
    entityType?: string;

    @Prop()
    @ApiProperty({ description: 'Public URL to access the image', example: 'https://example.com/api/images/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    url?: string;

    // Timestamps are added automatically by the SchemaFactory
    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date' })
    updatedAt: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
export type ImageDocument = Image & Document;