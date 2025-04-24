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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'The customer has been successfully created.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data.',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Customer code already exists.',
    })
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    @Roles('admin', 'user')
    @ApiOperation({ summary: 'Get all customers with pagination and search' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return the list of customers.',
    })
    async findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
    ) {
        return this.customersService.findAll(page, limit, search);
    }

    @Get(':id/orders')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Get all customers with pagination and search' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return the customer.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Customer not found.',
    })
    findAllOrder(@Param('id') id: string) {
        return this.customersService.findAllOrder(id);
    }

    @Get('stats')
    @Roles('admin')
    @ApiOperation({ summary: 'Get customer statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return customer statistics.',
    })
    getStats() {
        return this.customersService.getCustomerStats();
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Get a customer by id' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return the customer.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Customer not found.',
    })
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Update a customer' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'The customer has been successfully updated.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Customer not found.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data.',
    })
    update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a customer' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'The customer has been successfully deleted.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Customer not found.',
    })
    remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }

    @Patch(':id/stats')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Update customer statistics' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'The customer statistics have been successfully updated.',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Customer not found.',
    })
    updateStats(
        @Param('id') id: string,
        @Body() stats: {
            totalSpent?: number;
            totalOrders?: number;
            successfulOrders?: number;
            canceledOrders?: number;
        }
    ) {
        return this.customersService.updateCustomerStats(id, stats);
    }
} 