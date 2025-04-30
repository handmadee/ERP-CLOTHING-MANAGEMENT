import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CostumesService } from './costumes.service';
import { CostumesController } from './costumes.controller';
import { Costume, CostumeSchema } from './models/costume.model';
import { CategoriesModule } from '../categories/categories.module';
import { CustomLogger } from '../../common/services/logger.service';
import { ImagesModule } from '../images/images.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Costume.name, schema: CostumeSchema }]),
        ImagesModule,
        CategoriesModule,
    ],
    controllers: [CostumesController],
    providers: [CostumesService, CustomLogger],
    exports: [CostumesService],
})
export class CostumesModule { } 