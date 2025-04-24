import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageResponseDto {
    @ApiProperty({ example: '60a6f75c9f546d429c3a11d8' })
    _id: string;

    @ApiProperty({ example: 'wedding_dress.jpg' })
    originalName: string;

    @ApiProperty({ example: '6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    filename: string;

    @ApiProperty({ example: 'uploads/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    path: string;

    @ApiProperty({ example: 'image/jpeg' })
    mimetype: string;

    @ApiProperty({ example: 1048576 })
    size: number;

    @ApiProperty({ example: true })
    compressed: boolean;

    @ApiProperty({
        example: { width: 1920, height: 1080, optimized: true }
    })
    metadata: Record<string, any>;

    @ApiProperty({
        enum: ['pending', 'processing', 'completed', 'failed'],
        example: 'completed'
    })
    status: string;

    @ApiProperty({ example: 'https://example.com/api/images/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg' })
    url: string;

    @ApiProperty({ example: '2023-10-15T08:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2023-10-15T08:35:00.000Z' })
    updatedAt: Date;
}

export class UploadImageDto {
    @ApiPropertyOptional({ description: 'ID of the entity this image is related to' })
    @IsOptional()
    @IsMongoId()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Type of entity (e.g., "costume", "category")' })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({ description: 'Whether to compress the image', default: true })
    @IsOptional()
    @Type(() => Boolean)
    compress?: boolean;
}

export class LinkImageDto {
    @ApiProperty({ description: 'ID of the entity to link the image to' })
    @IsNotEmpty()
    @IsMongoId()
    entityId: string;

    @ApiProperty({ description: 'Type of entity (e.g., "costume", "category")' })
    @IsNotEmpty()
    @IsString()
    entityType: string;
}

export class ImageFilterDto {
    @ApiPropertyOptional({ description: 'Filter by entity ID' })
    @IsOptional()
    @IsMongoId()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Filter by entity type' })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: ['pending', 'processing', 'completed', 'failed']
    })
    @IsOptional()
    @IsEnum(['pending', 'processing', 'completed', 'failed'])
    status?: string;

    @ApiPropertyOptional({ description: 'Filter by compressed status' })
    @IsOptional()
    @Type(() => Boolean)
    compressed?: boolean;
} 