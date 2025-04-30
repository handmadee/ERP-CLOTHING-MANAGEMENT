import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './models/category.model';
import { CustomLogger } from '../../common/services/logger.service';
import { ImagesModule } from '../images/images.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
        ImagesModule,
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService, CustomLogger],
    exports: [CategoriesService],
})
export class CategoriesModule { } 