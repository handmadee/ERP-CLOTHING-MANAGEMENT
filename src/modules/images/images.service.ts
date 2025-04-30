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
import * as crypto from 'crypto';
import * as mime from 'mime-types';

const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class ImagesService {
    private readonly logger = new Logger(ImagesService.name);
    private readonly uploadPath: string;
    private readonly baseUrl: string;
    private readonly compressionQuality: number;
    private readonly maxFileSize: number;
    private readonly allowedMimeTypes: string[];
    private readonly thumbnailSizes: { width: number; height: number }[];

    constructor(
        @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
        private configService: ConfigService,
    ) {
        this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
        this.baseUrl = this.configService.get<string>('BASE_URL', 'http://14.225.207.9:3000');
        this.compressionQuality = this.configService.get<number>('COMPRESSION_QUALITY', 80);
        this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
        this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.thumbnailSizes = [
            { width: 150, height: 150 },
            { width: 300, height: 300 },  // Small
            { width: 600, height: 600 },  // Medium
        ];
        this.initializeUploadDirectory();
    }

    private async initializeUploadDirectory() {
        try {
            if (!await existsAsync(this.uploadPath)) {
                await mkdirAsync(this.uploadPath, { recursive: true });
            }
            for (const size of this.thumbnailSizes) {
                const sizePath = path.join(this.uploadPath, `${size.width}x${size.height}`);
                if (!await existsAsync(sizePath)) {
                    await mkdirAsync(sizePath, { recursive: true });
                }
            }
        } catch (error) {
            this.logger.error(`Failed to initialize upload directories: ${error.message}`);
            throw error;
        }
    }

    private generateUniqueFilename(originalFilename: string): string {
        const timestamp = Date.now();
        const hash = crypto.createHash('md5')
            .update(`${originalFilename}${timestamp}`)
            .digest('hex');
        const ext = path.extname(originalFilename);
        return `${hash}${ext}`;
    }

    private async validateFile(file: Express.Multer.File): Promise<void> {
        if (!file) {
            this.logger.error('No file provided in the request');
            throw new BadRequestException('No file uploaded');
        }

        if (file.size <= 0) {
            this.logger.error('File is empty');
            throw new BadRequestException('Empty file uploaded');
        }

        if (file.size > this.maxFileSize) {
            this.logger.warn(`File size ${file.size} bytes exceeds limit of ${this.maxFileSize} bytes`);
            throw new BadRequestException(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            this.logger.warn(`Invalid mime type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
            throw new BadRequestException(`Invalid file type. Allowed types: ${this.allowedMimeTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`);
        }

        try {
            const buffer = file.buffer || await fs.promises.readFile(file.path);
            const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
            const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
            const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
            const isWEBP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

            if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
                this.logger.error('File magic numbers do not match any supported image format');
                throw new BadRequestException('Invalid image format. File appears to be corrupted or not a supported image type.');
            }
            const metadata = await sharp(buffer).metadata();
            if (!metadata.width || !metadata.height) {
                this.logger.error('Image metadata missing dimensions');
                throw new BadRequestException('Invalid image file: Could not determine image dimensions');
            }
            this.logger.debug(`Image validation successful: ${metadata.format} ${metadata.width}x${metadata.height}`);
        } catch (error) {
            this.logger.error(`Image validation failed: ${error.message}`, error.stack);
            throw new BadRequestException(`Invalid image file: ${error.message}`);
        }
    }

    async saveImageInfo(file: Express.Multer.File, entityId?: string, entityType?: string): Promise<Image> {
        try {
            await this.validateFile(file);

            const filename = this.generateUniqueFilename(file.originalname);
            const filePath = path.join(this.uploadPath, filename);

            // If file is already on disk (using disk storage), move it to the right location
            if (file.path) {
                await fs.promises.rename(file.path, filePath);
            } else {
                // If using memory storage, save the buffer to disk
                await sharp(file.buffer).withMetadata().toFile(filePath);
            }

            // Get image metadata using the file from disk
            const metadata = await sharp(filePath).metadata();

            // Generate thumbnails
            const thumbnails = await Promise.all(
                this.thumbnailSizes.map(async size => {
                    const thumbFilename = `${size.width}x${size.height}_${filename}`;
                    const thumbPath = path.join(this.uploadPath, `${size.width}x${size.height}`, thumbFilename);

                    await sharp(filePath)
                        .resize(size.width, size.height, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .withMetadata()
                        .toFile(thumbPath);

                    return {
                        size: `${size.width}x${size.height}`,
                        url: `${this.baseUrl}/uploads/${size.width}x${size.height}/${thumbFilename}`
                    };
                })
            );

            const imageUrl = `${this.baseUrl}/uploads/${filename}`;

            const imageData = {
                originalName: file.originalname,
                filename,
                path: filePath,
                mimetype: file.mimetype,
                size: file.size,
                status: 'pending',
                url: imageUrl,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    thumbnails,
                    originalSize: file.size
                },
                ...(entityId && { entityId: new Types.ObjectId(entityId) }),
                ...(entityType && { entityType }),
            };

            const createdImage = new this.imageModel(imageData);
            const savedImage = await createdImage.save();

            // Trigger async compression
            this.compressImage(savedImage._id.toString()).catch(error => {
                this.logger.error(`Background compression failed: ${error.message}`);
            });

            return savedImage;
        } catch (error) {
            this.logger.error(`Failed to save image: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to save image: ${error.message}`);
        }
    }

    /**
     * Compress an uploaded image
     */
    async compressImage(imageId: string): Promise<Image> {
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

            // Optimize compression settings based on image type
            let transformer = sharp(originalPath).withMetadata();

            if (fileExt === '.jpg' || fileExt === '.jpeg') {
                transformer = transformer
                    .jpeg({
                        quality: this.compressionQuality,
                        mozjpeg: true // Use mozjpeg for better compression
                    });
            } else if (fileExt === '.png') {
                transformer = transformer
                    .png({
                        quality: this.compressionQuality,
                        compressionLevel: 9,
                        palette: true
                    });
            } else if (fileExt === '.webp') {
                transformer = transformer
                    .webp({
                        quality: this.compressionQuality,
                        lossless: false,
                        nearLossless: true
                    });
            } else if (fileExt === '.gif') {
                transformer = transformer.gif();
            }

            // Save the compressed image
            await transformer.toFile(compressedPath);

            // Get compressed file size
            const compressedStats = fs.statSync(compressedPath);
            const originalSize = image.size;
            const compressedSize = compressedStats.size;
            const compressionRatio = Math.round((1 - (compressedSize / originalSize)) * 100);

            // If compression didn't help, keep original
            if (compressedSize >= originalSize) {
                await unlinkAsync(compressedPath);

                image.compressed = true;
                image.status = 'completed';
                image.metadata = {
                    ...image.metadata,
                    compressionAttempted: true,
                    compressionSuccessful: false,
                    reason: 'Compression would increase file size'
                };

                return await image.save();
            }

            // Update image record with new file info
            await unlinkAsync(originalPath); // Delete original

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
                format: metadata.format,
                originalSize,
                compressedSize,
                compressionRatio: `${compressionRatio}%`,
                compressionQuality: this.compressionQuality,
                optimizationTechnique: fileExt === '.jpg' ? 'mozjpeg' :
                    fileExt === '.png' ? 'pngquant' :
                        fileExt === '.webp' ? 'webp' : 'standard'
            };

            return await image.save();
        } catch (error) {
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

    /**
     * Clean up old unlinked images
     */
    async cleanupUnlinkedImages(olderThanDays: number = 7): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const unlinkedImages = await this.imageModel.find({
            entityId: { $exists: false },
            createdAt: { $lt: cutoffDate }
        });

        let deletedCount = 0;
        for (const image of unlinkedImages) {
            try {
                await this.deleteImage(image._id.toString());
                deletedCount++;
            } catch (error) {
                this.logger.error(`Failed to delete image ${image._id}: ${error.message}`);
            }
        }

        return deletedCount;
    }

    /**
     * Get image dimensions and optimization suggestions
     */
    async analyzeImage(imageId: string): Promise<any> {
        const image = await this.findById(imageId);
        const metadata = await sharp(image.path).metadata();

        const analysis = {
            dimensions: {
                width: metadata?.width ?? 0,
                height: metadata?.height ?? 0,
                aspectRatio: (metadata?.width && metadata?.height) ? metadata.width / metadata.height : 0
            },
            size: {
                bytes: image.size,
                megabytes: (image.size / (1024 * 1024)).toFixed(2)
            },
            format: metadata?.format ?? 'unknown',
            compressed: image.compressed,
            suggestions: [] as string[]
        };

        // Add optimization suggestions
        if (!image.compressed) {
            analysis.suggestions.push('Image can be compressed to reduce file size');
        }
        if ((metadata?.width ?? 0) > 2000 || (metadata?.height ?? 0) > 2000) {
            analysis.suggestions.push('Image dimensions are very large, consider resizing');
        }
        if (image.mimetype === 'image/png' && image.size > 1024 * 1024) {
            analysis.suggestions.push('Large PNG file, consider converting to WebP or JPEG');
        }

        return analysis;
    }
} 