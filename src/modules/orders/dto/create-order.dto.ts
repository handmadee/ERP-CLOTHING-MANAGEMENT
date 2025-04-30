import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsEmail,
    IsOptional,
    IsDate,
    IsEnum,
    IsArray,
    ValidateNested,
    Min,
    IsMongoId,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORDER_STATUS } from 'src/common/constants';

export class CreateOrderItemDto {
    @ApiProperty({
        description: 'ID của trang phục',
        type: String
    })
    @IsMongoId()
    @IsNotEmpty({ message: 'ID trang phục không được để trống' })
    costumeId: string;

    @ApiProperty({
        description: 'Số lượng',
        minimum: 1,
        example: 1
    })
    @IsNumber()
    @Min(1, { message: 'Số lượng phải lớn hơn 0' })
    quantity: number;

    @ApiProperty({
        description: 'Đơn giá',
        minimum: 0,
        example: 100000
    })
    @IsNumber()
    @Min(0, { message: 'Đơn giá không thể âm' })
    price: number;

    @ApiPropertyOptional({
        description: 'Thành tiền (tự động tính từ số lượng * đơn giá)',
        minimum: 0,
        example: 100000
    })
    @IsNumber()
    @IsOptional()
    @Min(0, { message: 'Thành tiền không thể âm' })
    subtotal?: number;
}

export class CreateOrderDto {
    @ApiPropertyOptional({
        description: 'Mã đơn hàng (tự động sinh ra)',
        example: 'MG_000001',
        readOnly: true
    })
    orderCode?: string;

    @ApiPropertyOptional({
        description: 'ID khách hàng (tự động tạo nếu chưa có)',
        type: String
    })
    @IsMongoId()
    @IsOptional()
    customerId?: string;

    @ApiProperty({
        description: 'Tên khách hàng',
        example: 'Nguyễn Văn A'
    })
    @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
    @IsString()
    customerName: string;

    @ApiProperty({
        description: 'Số điện thoại khách hàng',
        example: '0123456789',
        pattern: '^[0-9]{10}$'
    })
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại không hợp lệ' })
    customerPhone: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ khách hàng',
        example: '123 Đường ABC, Quận XYZ, TP.HCM'
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({
        description: 'Ngày đặt hàng',
        type: Date,
        example: new Date().toISOString()
    })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty({ message: 'Ngày đặt hàng không được để trống' })
    orderDate: Date;

    @ApiProperty({
        description: 'Ngày trả hàng',
        type: Date,
        example: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty({ message: 'Ngày trả hàng không được để trống' })
    returnDate: Date;

    @ApiProperty({
        description: 'Danh sách sản phẩm',
        type: [CreateOrderItemDto],
        isArray: true
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @ApiProperty({
        description: 'Tổng tiền',
        minimum: 0,
        example: 1000000
    })
    @IsNumber()
    @Min(0, { message: 'Tổng tiền không thể âm' })
    total: number;

    @ApiProperty({
        description: 'Tiền đặt cọc',
        minimum: 0,
        example: 500000
    })
    @IsNumber()
    @Min(0, { message: 'Tiền đặt cọc không thể âm' })
    deposit: number;

    @ApiProperty({
        description: 'Số tiền còn lại',
        minimum: 0,
        example: 500000
    })
    @IsNumber()
    @Min(0, { message: 'Số tiền còn lại không thể âm' })
    remainingAmount: number;

    @ApiProperty({
        description: 'Trạng thái đơn hàng',
        enum: ORDER_STATUS,
        default: ORDER_STATUS.PENDING,
        example: ORDER_STATUS.PENDING
    })
    @IsEnum(ORDER_STATUS)
    @IsOptional()
    status?: ORDER_STATUS = ORDER_STATUS.PENDING;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'Ghi chú về đơn hàng'
    })
    @IsOptional()
    @IsString()
    note?: string;
} 