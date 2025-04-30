import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category } from './models/category.model';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
    ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

import { ImagesService } from '../images/images.service';
import { CustomLogger } from '../../common/services/logger.service';

@ApiTags('Danh mục trang phục')
@Controller('api/categories')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CategoriesController {
    constructor(
        private readonly categoriesService: CategoriesService,
        private readonly imagesService: ImagesService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext('CategoriesController');
    }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Tạo danh mục mới' })
    @ApiBody({ type: CreateCategoryDto })
    @ApiResponse({
        status: 201,
        description: 'Tạo danh mục thành công',
        type: Category,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục' })
    @ApiResponse({
        status: 200,
        description: 'Danh sách danh mục',
        type: [Category],
    })
    async findAll(): Promise<Category[]> {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin danh mục theo ID' })
    @ApiParam({ name: 'id', description: 'ID của danh mục' })
    @ApiResponse({
        status: 200,
        description: 'Thông tin danh mục',
        type: Category,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    async findOne(@Param('id') id: string): Promise<Category> {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Cập nhật thông tin danh mục' })
    @ApiParam({ name: 'id', description: 'ID của danh mục' })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiResponse({
        status: 200,
        description: 'Thông tin danh mục sau khi cập nhật',
        type: Category,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Xóa danh mục' })
    @ApiParam({ name: 'id', description: 'ID của danh mục' })
    @ApiResponse({ status: 204, description: 'Xóa thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    @ApiResponse({ status: 400, description: 'Không thể xóa danh mục đang được sử dụng' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.categoriesService.remove(id);
    }

    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload image for a category' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Image uploaded successfully',
    })
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        // First, verify the category exists
        await this.categoriesService.findOne(id);

        // Then upload and link the image
        const image = await this.imagesService.saveImageInfo(file, id, 'category');

        // Start compression in the background
        this.imagesService.compressImage(image._id.toString())
            .catch(error => {
                this.logger.error(`Error compressing image: ${error.message}`, error.stack);
            });

        return image;
    }

    @Get(':id/images')
    @ApiOperation({ summary: 'Get all images for a category' })
    @ApiResponse({
        status: 200,
        description: 'List of category images',
    })
    async getCategoryImages(@Param('id') id: string) {
        // First, verify the category exists
        await this.categoriesService.findOne(id);

        // Then get all related images
        return this.imagesService.findByEntity(id, 'category');
    }
} 