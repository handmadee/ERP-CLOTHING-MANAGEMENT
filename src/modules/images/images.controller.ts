import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseInterceptors,
    UploadedFile,
    Res,
    HttpStatus,
    ParseFilePipeBuilder,
    BadRequestException,
    StreamableFile,
    Logger,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiParam,
    ApiResponse,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { ImageFilterDto, ImageResponseDto, LinkImageDto, UploadImageDto } from './dto/image.dto';
import { Image } from './models/image.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Images')
@Controller('api/images')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ImagesController {
    private readonly logger = new Logger(ImagesController.name);

    constructor(private readonly imagesService: ImagesService) { }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload an image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload',
                },
                entityId: {
                    type: 'string',
                    description: 'ID of the entity to associate with the image',
                },
                entityType: {
                    type: 'string',
                    description: 'Type of entity (e.g., costume, category)',
                },
                compress: {
                    type: 'boolean',
                    default: true,
                    description: 'Whether to compress the image',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Image uploaded successfully',
        type: ImageResponseDto,
    })
    async uploadImage(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addMaxSizeValidator({
                    maxSize: 5 * 1024 * 1024,
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    exceptionFactory: (error) => new BadRequestException(error),
                }),
        )
        file: Express.Multer.File,
        @Body() uploadImageDto: UploadImageDto,
    ): Promise<Image> {
        const savedImage = await this.imagesService.saveImageInfo(
            file,
            uploadImageDto.entityId,
            uploadImageDto.entityType,
        );
        if (uploadImageDto.compress !== false) {
            this.imagesService.compressImage(savedImage._id.toString())
                .catch(error => {
                    this.logger.error(`Error compressing image ${savedImage._id}: ${error.message}`, error.stack);
                });
            savedImage.status = 'processing';
        }

        return savedImage;
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all images with optional filtering' })
    @ApiResponse({
        status: 200,
        description: 'List of images',
        type: [ImageResponseDto],
    })
    async findAll(@Query() filterDto: ImageFilterDto): Promise<Image[]> {
        return this.imagesService.findAll(filterDto);
    }

    @Get('entity/:entityType/:entityId')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all images for a specific entity' })
    @ApiParam({ name: 'entityType', description: 'Type of entity (e.g., costume, category)' })
    @ApiParam({ name: 'entityId', description: 'ID of the entity' })
    @ApiResponse({
        status: 200,
        description: 'List of images for the entity',
        type: [ImageResponseDto],
    })
    async findByEntity(
        @Param('entityId') entityId: string,
        @Param('entityType') entityType: string,
    ): Promise<Image[]> {
        return this.imagesService.findByEntity(entityId, entityType);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get image by ID' })
    @ApiParam({ name: 'id', description: 'Image ID' })
    @ApiResponse({
        status: 200,
        description: 'Image information',
        type: ImageResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async findOne(@Param('id') id: string): Promise<Image> {
        return this.imagesService.findById(id);
    }

    @Get('file/:filename')
    @Public()
    @ApiOperation({ summary: 'Get image file by filename' })
    @ApiParam({ name: 'filename', description: 'Image filename' })
    @ApiResponse({
        status: 200,
        description: 'Image file stream',
    })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async getImageFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { path, mimetype } = await this.imagesService.getImageFile(filename);

        res.set({
            'Content-Type': mimetype,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'max-age=31536000, public', // Cache for 1 year
        });

        const file = createReadStream(path);
        return new StreamableFile(file);
    }

    @Patch(':id/link')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Link an image to an entity' })
    @ApiParam({ name: 'id', description: 'Image ID' })
    @ApiBody({ type: LinkImageDto })
    @ApiResponse({
        status: 200,
        description: 'Image linked successfully',
        type: ImageResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async linkToEntity(
        @Param('id') id: string,
        @Body() linkImageDto: LinkImageDto,
    ): Promise<Image> {
        return this.imagesService.linkImageToEntity(id, linkImageDto);
    }

    @Patch(':id/compress')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Compress an image' })
    @ApiParam({ name: 'id', description: 'Image ID' })
    @ApiResponse({
        status: 200,
        description: 'Image compressed successfully',
        type: ImageResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async compressImage(@Param('id') id: string): Promise<Image> {
        return this.imagesService.compressImage(id);
    }

    @Post('batch/compress')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Batch compress uncompressed images' })
    @ApiResponse({
        status: 200,
        description: 'Batch compression results',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', description: 'Total images processed' },
                processed: { type: 'number', description: 'Successfully compressed' },
                failed: { type: 'number', description: 'Failed to compress' },
            },
        },
    })
    async batchCompress(): Promise<{ total: number; processed: number; failed: number }> {
        return this.imagesService.batchCompressImages();
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete an image' })
    @ApiParam({ name: 'id', description: 'Image ID' })
    @ApiResponse({ status: 204, description: 'Image deleted successfully' })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async deleteImage(@Param('id') id: string, @Res() res: Response): Promise<void> {
        await this.imagesService.deleteImage(id);
        res.status(HttpStatus.NO_CONTENT).send();
    }
} 