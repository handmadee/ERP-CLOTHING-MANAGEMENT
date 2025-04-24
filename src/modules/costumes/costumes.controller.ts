import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ValidationPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { CostumesService } from './costumes.service';
import { CreateCostumeDto, UpdateCostumeDto, CostumeFilterDto } from './dto/costume.dto';
import { Costume } from './models/costume.model';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiBody,
    ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ImagesService } from '../images/images.service';
import { CustomLogger } from '../../common/services/logger.service';

@ApiTags('Quản lý trang phục')
@Controller('api/costumes')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CostumesController {
    constructor(
        private readonly costumesService: CostumesService,
        private readonly imagesService: ImagesService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext('CostumesController');
    }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Tạo trang phục mới' })
    @ApiBody({ type: CreateCostumeDto })
    @ApiResponse({
        status: 201,
        description: 'Tạo trang phục thành công',
        type: Costume
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 409, description: 'Mã sản phẩm đã tồn tại' })
    async create(@Body() createCostumeDto: CreateCostumeDto): Promise<Costume> {
        return this.costumesService.create(createCostumeDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách trang phục với bộ lọc' })
    @ApiQuery({ name: 'code', required: false, description: 'Lọc theo mã sản phẩm' })
    @ApiQuery({ name: 'name', required: false, description: 'Lọc theo tên trang phục' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'Lọc theo danh mục' })
    @ApiQuery({ name: 'status', required: false, enum: ['available', 'rented', 'maintenance'], description: 'Lọc theo trạng thái' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt'], description: 'Sắp xếp theo trường' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Thứ tự sắp xếp' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
    @ApiQuery({ name: 'limit', required: false, description: 'Số mục trên trang' })
    @ApiResponse({
        status: 200,
        description: 'Danh sách trang phục',
    })
    async findAll(@Query(new ValidationPipe({ transform: true })) filterDto: CostumeFilterDto) {
        return this.costumesService.findAll(filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin trang phục theo ID' })
    @ApiParam({ name: 'id', description: 'ID của trang phục' })
    @ApiResponse({
        status: 200,
        description: 'Thông tin trang phục',
        type: Costume,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy trang phục' })
    async findOne(@Param('id') id: string): Promise<Costume> {
        return this.costumesService.findOne(id);
    }

    @Get('code/:code')
    @ApiOperation({ summary: 'Lấy thông tin trang phục theo mã sản phẩm' })
    @ApiParam({ name: 'code', description: 'Mã sản phẩm của trang phục' })
    @ApiResponse({
        status: 200,
        description: 'Thông tin trang phục',
        type: Costume,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy trang phục' })
    async findByCode(@Param('code') code: string): Promise<Costume> {
        return this.costumesService.findByCode(code);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Cập nhật thông tin trang phục' })
    @ApiParam({ name: 'id', description: 'ID của trang phục' })
    @ApiBody({ type: UpdateCostumeDto })
    @ApiResponse({
        status: 200,
        description: 'Thông tin trang phục sau khi cập nhật',
        type: Costume,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy trang phục' })
    @ApiResponse({ status: 409, description: 'Mã sản phẩm đã tồn tại' })
    async update(
        @Param('id') id: string,
        @Body() updateCostumeDto: UpdateCostumeDto,
    ): Promise<Costume> {
        return this.costumesService.update(id, updateCostumeDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Xóa trang phục' })
    @ApiParam({ name: 'id', description: 'ID của trang phục' })
    @ApiResponse({ status: 204, description: 'Xóa thành công' })
    @ApiResponse({ status: 400, description: 'Không thể xóa trang phục đang cho thuê' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy trang phục' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.costumesService.remove(id);
    }

    @Get('stats/by-status')
    @ApiOperation({ summary: 'Thống kê trang phục theo trạng thái' })
    @ApiResponse({
        status: 200,
        description: 'Thống kê thành công',
    })
    async getCostumesByStatus() {
        return this.costumesService.getCostumesByStatus();
    }

    @Get('stats/by-category')
    @ApiOperation({ summary: 'Thống kê trang phục theo danh mục' })
    @ApiResponse({
        status: 200,
        description: 'Thống kê thành công',
    })
    async getCostumesByCategory() {
        return this.costumesService.getCostumesByCategory();
    }

    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload image for a costume' })
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
        await this.costumesService.findOne(id);

        const image = await this.imagesService.saveImageInfo(file, id, 'costume');

        this.imagesService.compressImage(image._id.toString())
            .catch(error => {
                this.logger.error(`Error compressing image: ${error.message}`, error.stack);
            });

        return image;
    }

    @Get(':id/images')
    @ApiOperation({ summary: 'Get all images for a costume' })
    @ApiResponse({
        status: 200,
        description: 'List of costume images',
    })
    async getCostumeImages(@Param('id') id: string) {
        await this.costumesService.findOne(id);

        return this.imagesService.findByEntity(id, 'costume');
    }
} 