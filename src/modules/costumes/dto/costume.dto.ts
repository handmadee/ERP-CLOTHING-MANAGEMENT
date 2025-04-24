import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUrl, Min } from 'class-validator';
import { CostumeStatus } from '../models/costume.model';

export class CreateCostumeDto {
    @ApiProperty({ description: 'Mã sản phẩm, sẽ tự động tạo nếu không cung cấp', required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ description: 'Tên trang phục' })
    @IsNotEmpty({ message: 'Tên trang phục là bắt buộc' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'ID của danh mục' })
    @IsNotEmpty({ message: 'Danh mục là bắt buộc' })
    @IsString()
    categoryId: string;

    @ApiProperty({ description: 'Giá thuê' })
    @IsNotEmpty({ message: 'Giá thuê là bắt buộc' })
    @IsNumber({}, { message: 'Giá thuê phải là số' })
    @IsPositive({ message: 'Giá thuê phải là số dương' })
    price: number;

    @ApiProperty({ description: 'Kích thước' })
    @IsNotEmpty({ message: 'Kích thước là bắt buộc' })
    @IsString()
    size: string;

    @ApiProperty({
        description: 'Trạng thái trang phục',
        enum: ['available', 'rented', 'maintenance'],
        default: 'available'
    })
    @IsEnum(['available', 'rented', 'maintenance'], {
        message: 'Trạng thái phải là một trong: available, rented, maintenance',
    })
    status: CostumeStatus;

    @ApiProperty({ description: 'URL hình ảnh', required: false })
    @IsOptional()
    @IsUrl({}, { message: 'URL hình ảnh không hợp lệ' })
    imageUrl?: string;

    @ApiProperty({ description: 'Mô tả trang phục' })
    @IsNotEmpty({ message: 'Mô tả là bắt buộc' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Số lượng có sẵn', default: 1 })
    @IsNumber({}, { message: 'Số lượng phải là số' })
    @Min(0, { message: 'Số lượng không thể âm' })
    quantityAvailable: number;

    @ApiProperty({ description: 'Số lượng đã cho thuê', default: 0 })
    @IsNumber({}, { message: 'Số lượng phải là số' })
    @Min(0, { message: 'Số lượng không thể âm' })
    quantityRented: number;
}

export class UpdateCostumeDto extends CreateCostumeDto {
    @ApiProperty({ description: 'Mã sản phẩm, phải là duy nhất' })
    @IsOptional()
    @IsString()
    code?: string;
}

export class CostumeFilterDto {
    @ApiProperty({ description: 'Tìm theo mã sản phẩm', required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ description: 'Tìm theo tên sản phẩm', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Lọc theo danh mục', required: false })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiProperty({
        description: 'Lọc theo trạng thái',
        enum: ['available', 'rented', 'maintenance'],
        required: false
    })
    @IsOptional()
    @IsEnum(['available', 'rented', 'maintenance'], {
        message: 'Trạng thái phải là một trong: available, rented, maintenance',
    })
    status?: CostumeStatus;

    @ApiProperty({
        description: 'Sắp xếp theo trường',
        enum: ['name', 'price', 'createdAt'],
        default: 'name',
        required: false
    })
    @IsOptional()
    @IsEnum(['name', 'price', 'createdAt'])
    sortBy?: 'name' | 'price' | 'createdAt';

    @ApiProperty({
        description: 'Thứ tự sắp xếp',
        enum: ['ASC', 'DESC'],
        default: 'ASC',
        required: false
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';

    @ApiProperty({ description: 'Số trang', default: 1, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Số mục trên trang', default: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 10;
} 