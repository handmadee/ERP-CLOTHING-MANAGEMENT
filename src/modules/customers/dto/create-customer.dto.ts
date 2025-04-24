import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Mã khách hàng', example: 'KH001' })
    @IsOptional()
    customerCode?: string;

    @ApiProperty({ description: 'Họ và tên khách hàng', example: 'Nguyễn Văn A' })
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    @IsString()
    fullName: string;

    @ApiProperty({ description: 'Số điện thoại', example: '0123456789' })
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại không hợp lệ' })
    phone: string;

    @ApiProperty({ description: 'Địa chỉ', example: 'Hà Nội' })
    @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
    @IsString()
    address: string;

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Khách hàng VIP' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ description: 'Trạn thái', example: 'active' })
    @IsOptional()
    @IsString()
    status?: string;

} 