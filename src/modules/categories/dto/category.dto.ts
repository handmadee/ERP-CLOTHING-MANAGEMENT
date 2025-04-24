import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Tên danh mục' })
    @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Mã màu sắc dạng hex (ví dụ: #FF5733)' })
    @IsNotEmpty({ message: 'Màu sắc là bắt buộc' })
    @IsHexColor({ message: 'Màu sắc phải là mã hex hợp lệ' })
    color: string;

    @ApiProperty({ description: 'Mô tả danh mục', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateCategoryDto {
    @ApiProperty({ description: 'Tên danh mục', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Mã màu sắc dạng hex (ví dụ: #FF5733)', required: false })
    @IsOptional()
    @IsHexColor({ message: 'Màu sắc phải là mã hex hợp lệ' })
    color?: string;

    @ApiProperty({ description: 'Mô tả danh mục', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CategoryFilterDto {
    @ApiProperty({ description: 'Tìm kiếm theo tên', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Sắp xếp theo tên',
        enum: ['ASC', 'DESC'],
        default: 'ASC',
        required: false
    })
    @IsOptional()
    sortBy?: 'ASC' | 'DESC' = 'ASC';
} 