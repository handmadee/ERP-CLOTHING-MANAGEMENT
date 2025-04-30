import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';
import { CostumesModule } from '../costumes/costumes.module';
import { CategoriesModule } from '../categories/categories.module';
import { Order, OrderSchema } from '../orders/models/order.model';
import { Customer, CustomerSchema } from '../customers/models/customer.model';
import { Costume, CostumeSchema } from '../costumes/models/costume.model';
import { Category, CategorySchema } from '../categories/models/category.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Costume.name, schema: CostumeSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    OrdersModule,
    CustomersModule,
    CostumesModule,
    CategoriesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
