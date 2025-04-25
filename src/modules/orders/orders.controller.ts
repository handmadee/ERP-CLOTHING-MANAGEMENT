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
    HttpStatus,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Order } from './models/order.model';
import { RequestWithUser } from 'src/interfaces/requestUser.inerface';


@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/orders')

export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Create a new order' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'The order has been successfully created.',
        type: Order
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data.',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Order code already exists.',
    })
    create(@Body() createOrderDto: CreateOrderDto, @Req() req: RequestWithUser) {
        return this.ordersService.create(createOrderDto, req.user.userId);
    }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Get all orders with pagination and filters' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'active', 'completed', 'cancelled'] })
    @ApiQuery({ name: 'startDate', required: false, type: Date })
    @ApiQuery({ name: 'endDate', required: false, type: Date })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns a list of orders and total count',
        type: Order,
        isArray: true
    })
    findAll(@Query() query: any) {
        return this.ordersService.findAll(query);
    }

    @Get('stats/overview')
    @Roles('admin')
    @ApiOperation({ summary: 'Get order statistics' })
    @ApiQuery({ name: 'startDate', required: false, type: Date })
    @ApiQuery({ name: 'endDate', required: false, type: Date })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns order statistics',
        schema: {
            type: 'object',
            properties: {
                totalOrders: { type: 'number' },
                totalRevenue: { type: 'number' },
                ordersByStatus: {
                    type: 'object',
                    properties: {
                        pending: { type: 'number' },
                        active: { type: 'number' },
                        completed: { type: 'number' },
                        cancelled: { type: 'number' }
                    }
                },
                recentOrders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Order' }
                }
            }
        }
    })
    getOrderStats(@Query() query: { startDate?: Date; endDate?: Date }) {
        return this.ordersService.getOrderStats(query);
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Get a specific order by ID' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns the order',
        type: Order
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Order not found.',
    })
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Update a specific order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'The order has been successfully updated.',
        type: Order
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Order not found.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data.',
    })
    update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.ordersService.update(id, updateOrderDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a specific order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'The order has been successfully deleted.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Order not found.',
    })
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
} 