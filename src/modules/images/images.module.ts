import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image, ImageSchema } from './models/image.model';
import { existsSync, mkdirSync } from 'fs';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Image.name, schema: ImageSchema }
        ]),
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const uploadPath = configService.get<string>('UPLOAD_PATH', './uploads');
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }

                return {
                    storage: diskStorage({
                        destination: (req, file, callback) => {
                            callback(null, uploadPath);
                        },
                        filename: (req, file, callback) => {
                            // Generate a unique filename with original extension
                            const uniqueFilename = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
                            callback(null, uniqueFilename);
                        },
                    }),
                    fileFilter: (req, file, callback) => {
                        // Accept only images
                        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                            return callback(new Error('Only image files are allowed!'), false);
                        }
                        callback(null, true);
                    },
                    limits: {
                        fileSize: configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024), // 5MB default max file size
                    },
                };
            },
        }),
    ],
    controllers: [ImagesController],
    providers: [ImagesService],
    exports: [ImagesService],
})
export class ImagesModule { } 