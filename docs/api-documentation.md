# Wedding Management System API Documentation

# Tài Liệu API Hệ Thống Quản Lý Áo Cưới

## Base URL / URL Cơ Sở

```
http://localhost:3000/api/v1
```

## Authentication / Xác Thực

All API requests require a Bearer token in the Authorization header.
Tất cả các request API cần có Bearer token trong header Authorization.

```
Authorization: Bearer <your_token>
```

## Common Response Format / Định Dạng Response Chung

```typescript
// Success Response / Response Thành Công
{
    success: true,
    data: T,
    message?: string
}

// Error Response / Response Lỗi
{
    success: false,
    error: {
        code: string,
        message: string
    }
}
```

## API Endpoints

### 1. Orders Management / Quản Lý Đơn Hàng

#### 1.1. Get Orders List / Lấy Danh Sách Đơn Hàng

```typescript
GET /orders

// Query Parameters
{
    page?: number;         // Default: 1
    limit?: number;        // Default: 10
    search?: string;       // Tìm theo mã đơn/tên khách/SĐT
    status?: string;       // [pending, active, completed, cancelled]
    startDate?: string;    // Format: YYYY-MM-DD
    endDate?: string;      // Format: YYYY-MM-DD
    sortBy?: string;       // Default: createdAt
    sortOrder?: 'asc' | 'desc'; // Default: desc
}

// Response
{
    success: true,
    data: {
        items: Array<{
            _id: string;
            orderCode: string;
            customerName: string;
            customerPhone: string;
            orderDate: string;
            returnDate: string;
            status: string;
            total: number;
            deposit: number;
            remainingAmount: number;
            items: Array<{
                costumeId: {
                    _id: string;
                    code: string;
                    name: string;
                };
                quantity: number;
                price: number;
                subtotal: number;
            }>;
        }>;
        total: number;
        page: number;
        limit: number;
    }
}
```

#### 1.2. Get Order Details / Xem Chi Tiết Đơn Hàng

```typescript
GET /orders/:id

// Response
{
    success: true,
    data: {
        orderDetails: {
            _id: string;
            orderCode: string;
            customerId: {
                customerCode: string;
                fullName: string;
                phone: string;
                email?: string;
                address?: string;
            };
            items: Array<{
                costumeCode: string;
                costumeName: string;
                quantity: number;
                price: number;
                subtotal: number;
                availability: {
                    total: number;
                    available: number;
                    rented: number;
                    percentageRented: string;
                };
            }>;
            total: number;
            deposit: number;
            remainingAmount: number;
            status: string;
            orderDate: string;
            returnDate: string;
        };
        rentalMetrics: {
            rentalDuration: number;
            daysUntilReturn: number;
            isOverdue: boolean;
            status: string;
            daysLabel: string;
        };
        financialMetrics: {
            total: number;
            deposit: number;
            remainingAmount: number;
            paymentStatus: string;
            paymentPercentage: string;
        };
        customerHistory: {
            previousOrders: Array<{
                orderCode: string;
                orderDate: string;
                total: number;
                status: string;
            }>;
            totalOrders: number;
            isReturningCustomer: boolean;
        };
        timeline: Array<{
            date: string;
            status: string;
            note: string;
            formattedDate: string;
        }>;
    }
}
```

#### 1.3. Create New Order / Tạo Đơn Hàng Mới

```typescript
POST /orders

// Request Body
{
    customerName: string;
    customerPhone: string;
    address?: string;
    orderDate: string;     // Format: YYYY-MM-DD
    returnDate: string;    // Format: YYYY-MM-DD
    items: Array<{
        costumeId: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    deposit: number;
    note?: string;
    status?: 'pending' | 'active';  // Default: pending
}

// Response: Created Order Details
```

#### 1.4. Update Order / Cập Nhật Đơn Hàng

```typescript
PATCH /orders/:id

// Request Body
{
    customerName?: string;
    customerPhone?: string;
    address?: string;
    orderDate?: string;
    returnDate?: string;
    status?: 'pending' | 'active' | 'completed' | 'cancelled';
    deposit?: number;
    note?: string;
}

// Response: Updated Order Details
```

### 2. Dashboard Statistics / Thống Kê Dashboard

#### 2.1. Get Overview Stats / Lấy Thống Kê Tổng Quan

```typescript
GET /orders/stats/overview

// Query Parameters
{
    startDate?: string;    // Format: YYYY-MM-DD
    endDate?: string;      // Format: YYYY-MM-DD
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Response
{
    success: true,
    data: {
        summary: {
            totalOrders: number;
            pendingOrders: number;
            activeOrders: number;
            completedOrders: number;
            cancelledOrders: number;
            monthlyRevenue: number;
            avgOrderValue: number;
            depositCollectionRate: string;
        };
        performance: {
            orderCompletion: {
                completed: number;
                total: number;
                rate: string;
            };
            financials: {
                totalRevenue: number;
                collectedAmount: number;
                pendingAmount: number;
                avgOrderValue: number;
            };
            customerMetrics: {
                topCustomers: Array<{
                    customerInfo: {
                        customerCode: string;
                        fullName: string;
                        phone: string;
                    };
                    orderCount: number;
                    totalSpent: number;
                    avgOrderValue: number;
                    lastOrderDate: string;
                }>;
                topCostumes: Array<{
                    costumeInfo: {
                        code: string;
                        name: string;
                        price: number;
                    };
                    rentCount: number;
                    revenue: number;
                    avgPrice: number;
                }>;
            };
        };
        trends: {
            daily: Array<{
                date: string;
                revenue: number;
                orders: number;
                deposits: number;
                pending: number;
            }>;
            weekly: Array<{
                period: string;
                orderCount: number;
                revenue: number;
                avgOrderValue: number;
            }>;
            monthly: Array<{
                period: string;
                orderCount: number;
                revenue: number;
                avgOrderValue: number;
            }>;
        };
        recentOrders: Array<{
            orderCode: string;
            customerName: string;
            customerPhone: string;
            orderDate: string;
            returnDate: string;
            status: string;
            total: number;
            deposit: number;
            remainingAmount: number;
            items: number;
            createdBy: string;
        }>;
    }
}
```

### 3. Customers Management / Quản Lý Khách Hàng

#### 3.1. Get Customers List / Lấy Danh Sách Khách Hàng

```typescript
GET /customers

// Query Parameters
{
    page?: number;         // Default: 1
    limit?: number;        // Default: 10
    search?: string;       // Tìm theo mã/tên/SĐT
}

// Response
{
    success: true,
    data: {
        data: Array<{
            _id: string;
            customerCode: string;
            fullName: string;
            phone: string;
            address?: string;
            note?: string;
            totalSpent: number;
            orderStats: {
                total: number;
                pending: number;
                active: number;
                completed: number;
                cancelled: number;
            };
        }>;
        metadata: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }
}
```

### 4. Costumes Management / Quản Lý Trang Phục

#### 4.1. Get Costumes List / Lấy Danh Sách Trang Phục

```typescript
GET /costumes

// Query Parameters
{
    code?: string;         // Mã trang phục
    name?: string;         // Tên trang phục
    categoryId?: string;   // Mã danh mục
    status?: string;       // [available, maintenance]
    sortBy?: string;       // Default: name
    sortOrder?: string;    // [ASC, DESC]
    page?: number;         // Default: 1
    limit?: number;        // Default: 10
}

// Response
{
    success: true,
    data: {
        items: Array<{
            _id: string;
            code: string;
            name: string;
            category: {
                _id: string;
                name: string;
            };
            price: number;
            quantityAvailable: number;
            quantityRented: number;
            status: string;
            imageUrl?: string;
        }>;
        total: number;
        page: number;
        limit: number;
    }
}
```

## Error Codes / Mã Lỗi

```typescript
{
    BAD_REQUEST: 400,          // Dữ liệu không hợp lệ
    UNAUTHORIZED: 401,         // Chưa xác thực
    FORBIDDEN: 403,           // Không có quyền truy cập
    NOT_FOUND: 404,           // Không tìm thấy tài nguyên
    CONFLICT: 409,            // Xung đột dữ liệu
    INTERNAL_ERROR: 500       // Lỗi hệ thống
}
```

## Notes / Lưu Ý

1. Tất cả các ngày tháng đều sử dụng định dạng ISO: YYYY-MM-DD
2. Số tiền được tính bằng VND
3. Phân trang bắt đầu từ 1
4. Token hết hạn sau 24 giờ
5. Rate limit: 100 requests/minute

## Websocket Events / Sự Kiện Websocket

```typescript
// Kết nối
socket.connect('http://localhost:3000');

// Lắng nghe cập nhật đơn hàng
socket.on(
  'order:updated',
  (data: { orderId: string; status: string; updatedAt: string }) => {
    // Xử lý cập nhật
  },
);

// Lắng nghe cập nhật tồn kho
socket.on(
  'inventory:updated',
  (data: {
    costumeId: string;
    quantityAvailable: number;
    quantityRented: number;
  }) => {
    // Xử lý cập nhật
  },
);
```
