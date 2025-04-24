import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsArray, ValidateNested, IsNumber, Min, IsEnum, IsMongoId } from 'class-validator';
import { ORDER_STATUS } from '../../../common/constants';

export class UpdateOrderItemDto {
    @ApiPropertyOptional({ description: 'ID of the costume', type: String })
    @IsMongoId()
    @IsOptional()
    costumeId?: string;

    @ApiPropertyOptional({ description: 'Quantity of costumes ordered', minimum: 1 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    quantity?: number;

    @ApiPropertyOptional({ description: 'Price per unit', minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @ApiPropertyOptional({ description: 'Subtotal for this item', minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    subtotal?: number;
}

export class UpdateOrderDto {
    @ApiPropertyOptional({ description: 'Unique order code', example: 'ORD-2024-001' })
    @IsString()
    @IsOptional()
    orderCode?: string;

    @ApiPropertyOptional({ description: 'ID of the customer', type: String })
    @IsMongoId()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Name of the customer', example: 'John Doe' })
    @IsString()
    @IsOptional()
    customerName?: string;

    @ApiPropertyOptional({ description: 'Phone number of the customer', example: '+84123456789' })
    @IsString()
    @IsOptional()
    customerPhone?: string;

    @ApiPropertyOptional({ description: 'Email of the customer', example: 'john@example.com' })
    @IsString()
    @IsOptional()
    customerEmail?: string;

    @ApiPropertyOptional({ description: 'Date when the order is placed' })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    orderDate?: Date;

    @ApiPropertyOptional({ description: 'Date when the costumes should be returned' })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    returnDate?: Date;

    @ApiPropertyOptional({ type: [UpdateOrderItemDto], description: 'List of items in the order' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOrderItemDto)
    @IsOptional()
    items?: UpdateOrderItemDto[];

    @ApiPropertyOptional({ description: 'Total amount of the order', minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    total?: number;

    @ApiPropertyOptional({ description: 'Deposit amount paid', minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    deposit?: number;

    @ApiPropertyOptional({ description: 'Remaining amount to be paid', minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    remainingAmount?: number;

    @ApiPropertyOptional({
        enum: ORDER_STATUS,
        description: 'Status of the order'
    })
    @IsEnum(ORDER_STATUS)
    @IsOptional()
    status?: ORDER_STATUS;

    @ApiPropertyOptional({ description: 'Optional note about the order' })
    @IsString()
    @IsOptional()
    note?: string;
} 