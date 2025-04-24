import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { promisify } from 'util';
import { Image, ImageDocument } from './models/image.model';
import { ImageFilterDto, LinkImageDto } from './dto/image.dto';

const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

@Injectable()
export class ImagesService {
    private readonly logger = new Logger(ImagesService.name);
    private readonly uploadPath: string;
    private readonly baseUrl: string;
    private readonly compressionQuality: number;

    constructor(
        @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
        private configService: ConfigService,
    ) {
        this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
        this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
        this.compressionQuality = this.configService.get<number>('COMPRESSION_QUALITY', 80);
    }

    /**
     * Save image file information to database
     */
    async saveImageInfo(file: Express.Multer.File, entityId?: string, entityType?: string) {
        try {
            const imageUrl = `${this.baseUrl}/api/images/${file.filename}`;

            const imageData = {
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                mimetype: file.mimetype,
                size: file.size,
                status: 'completed',
                url: imageUrl,
                ...(entityId && { entityId: new Types.ObjectId(entityId) }),
                ...(entityType && { entityType }),
            };

            const createdImage = new this.imageModel(imageData);
            return await createdImage.save();
        } catch (error) {
            this.logger.error(`Failed to save image info: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to save image information');
        }
    }

    /**
     * Compress an uploaded image
     */
    async compressImage(imageId: string) {
        const image = await this.findById(imageId);

        if (image.compressed) {
            return image;
        }

        try {
            // Mark as processing
            image.status = 'processing';
            await image.save();

            const originalPath = image.path;
            const fileExt = path.extname(originalPath).toLowerCase();
            const compressedFilename = `compressed_${image.filename}`;
            const compressedPath = path.join(this.uploadPath, compressedFilename);

            // Get image info
            const metadata = await sharp(originalPath).metadata();

            // Compress the image based on type
            let transformer = sharp(originalPath).withMetadata();

            if (fileExt === '.jpg' || fileExt === '.jpeg') {
                transformer = transformer.jpeg({ quality: this.compressionQuality });
            } else if (fileExt === '.png') {
                transformer = transformer.png({ quality: this.compressionQuality });
            } else if (fileExt === '.webp') {
                transformer = transformer.webp({ quality: this.compressionQuality });
            } else if (fileExt === '.gif') {
                // GIF compression is limited in sharp, we'll just optimize it
                transformer = transformer.gif();
            }

            // Save the compressed image
            await transformer.toFile(compressedPath);

            // Get compressed file size
            const compressedStats = fs.statSync(compressedPath);

            // Update the image record
            const originalSize = image.size;
            const compressedSize = compressedStats.size;
            const compressionRatio = Math.round((1 - (compressedSize / originalSize)) * 100);

            // If compression actually made it larger, keep the original
            if (compressedSize >= originalSize) {
                await unlinkAsync(compressedPath);

                // Update image record
                image.compressed = true;
                image.status = 'completed';
                image.metadata = {
                    ...image.metadata,
                    width: metadata.width,
                    height: metadata.height,
                    compressionAttempted: true,
                    compressionSuccessful: false,
                    reason: 'Compression would increase file size'
                };

                return await image.save();
            }

            // Delete the original file if compression was successful
            await unlinkAsync(originalPath);

            // Update image record with new file info
            image.filename = compressedFilename;
            image.path = compressedPath;
            image.size = compressedSize;
            image.compressed = true;
            image.status = 'completed';
            image.url = `${this.baseUrl}/api/images/${compressedFilename}`;
            image.metadata = {
                ...image.metadata,
                width: metadata.width,
                height: metadata.height,
                originalSize,
                compressedSize,
                compressionRatio: `${compressionRatio}%`,
                compressionQuality: this.compressionQuality
            };

            return await image.save();
        } catch (error) {
            // Update record to show processing failed
            image.status = 'failed';
            image.metadata = {
                ...image.metadata,
                error: error.message
            };
            await image.save();

            this.logger.error(`Failed to compress image: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to compress image: ${error.message}`);
        }
    }

    /**
     * Link an image to an entity
     */
    async linkImageToEntity(imageId: string, linkImageDto: LinkImageDto) {
        const { entityId, entityType } = linkImageDto;
        const image = await this.findById(imageId);

        image.entityId = new Types.ObjectId(entityId);
        image.entityType = entityType;

        return await image.save();
    }

    /**
     * Find an image by ID
     */
    async findById(id: string) {
        let image;
        try {
            image = await this.imageModel.findById(id).exec();
        } catch (error) {
            throw new NotFoundException(`Image with ID ${id} not found`);
        }

        if (!image) {
            throw new NotFoundException(`Image with ID ${id} not found`);
        }

        return image;
    }

    /**
     * Find all images with optional filtering
     */
    async findAll(filterDto: ImageFilterDto): Promise<Image[]> {
        const filter: any = {};

        if (filterDto.entityId) {
            filter.entityId = new Types.ObjectId(filterDto.entityId);
        }

        if (filterDto.entityType) {
            filter.entityType = filterDto.entityType;
        }

        if (filterDto.status) {
            filter.status = filterDto.status;
        }

        if (filterDto.compressed !== undefined) {
            filter.compressed = filterDto.compressed;
        }

        return this.imageModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    /**
     * Get all images for a specific entity
     */
    async findByEntity(entityId: string, entityType: string): Promise<Image[]> {
        return this.imageModel.find({
            entityId: new Types.ObjectId(entityId),
            entityType,
        }).sort({ createdAt: -1 }).exec();
    }

    /**
     * Delete an image from database and storage
     */
    async deleteImage(id: string): Promise<void> {
        const image = await this.findById(id);

        // Delete the file from storage
        const filePath = image.path;
        if (await existsAsync(filePath)) {
            await unlinkAsync(filePath);
        }

        // Delete from database
        await this.imageModel.findByIdAndDelete(id).exec();
    }

    /**
     * Stream an image file by filename
     */
    async getImageFile(filename: string): Promise<{ path: string; mimetype: string }> {
        const image = await this.imageModel.findOne({ filename }).exec();

        if (!image) {
            throw new NotFoundException(`Image with filename ${filename} not found`);
        }

        const imagePath = image.path;
        if (!await existsAsync(imagePath)) {
            throw new NotFoundException(`Image file not found on server`);
        }

        return {
            path: imagePath,
            mimetype: image.mimetype,
        };
    }

    /**
     * Batch process images (e.g., compress all uncompressed images)
     */
    async batchCompressImages(): Promise<{ total: number; processed: number; failed: number }> {
        const uncompressedImages = await this.imageModel.find({
            compressed: false,
            status: { $nin: ['processing', 'failed'] }
        }).exec();

        let processed = 0;
        let failed = 0;

        for (const image of uncompressedImages) {
            try {
                await this.compressImage(image._id.toString());
                processed++;
            } catch (error) {
                failed++;
                this.logger.error(`Failed to process image ${image._id}: ${error.message}`);
            }
        }

        return {
            total: uncompressedImages.length,
            processed,
            failed
        };
    }
} 