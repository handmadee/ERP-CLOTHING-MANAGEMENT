import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CustomersModule } from '../customers/customers.module';
import { CostumesModule } from '../costumes/costumes.module';
import { Order, OrderSchema } from './models/order.model';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema }
        ]),
        CustomersModule,
        CostumesModule
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService]
})
export class OrdersModule { } 