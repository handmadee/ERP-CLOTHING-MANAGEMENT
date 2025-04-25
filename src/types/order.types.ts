export enum OrderStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface OrderItem {
    costumeId: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface TimelineEntry {
    date: Date;
    status: OrderStatus;
    note: string;
}

export interface CreateOrderDto {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address?: string;
    orderDate: Date;
    returnDate: Date;
    items: OrderItem[];
    total: number;
    deposit: number;
    remainingAmount: number;
    status?: OrderStatus;
    note?: string;
}

export interface UpdateOrderDto {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    address?: string;
    returnDate?: Date;
    deposit?: number;
    status?: OrderStatus;
    note?: string;
}

export interface Order {
    _id: string;
    orderCode: string;
    customerId: string;
    accountId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address?: string;
    orderDate: Date;
    returnDate: Date;
    items: OrderItem[];
    total: number;
    deposit: number;
    remainingAmount: number;
    status: OrderStatus;
    note?: string;
    timeline: TimelineEntry[];
    isOverdue?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface OrdersResponse {
    data: Order[];
    total: number;
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: {
        pending: number;
        active: number;
        completed: number;
        cancelled: number;
    };
    recentOrders: Order[];
} 