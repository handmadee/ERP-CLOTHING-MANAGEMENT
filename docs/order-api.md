# Order Management API Documentation / Tài liệu API Quản lý Đơn hàng

## Base URL / URL Cơ sở

```
${baseUrl}/orders
```

## Authentication / Xác thực

All APIs require Bearer token authentication / Tất cả API yêu cầu xác thực bằng Bearer token

```
Authorization: Bearer {token}
```

## 1. Create Order / Tạo Đơn hàng mới

### Endpoint

```
POST /orders
```

### Request Body / Dữ liệu gửi đi

```typescript
{
    customerName: string;      // Tên khách hàng (bắt buộc)
    customerPhone: string;     // Số điện thoại (bắt buộc, 10 số)
    customerEmail?: string;    // Email (không bắt buộc)
    address?: string;         // Địa chỉ (không bắt buộc)
    orderDate: Date;          // Ngày đặt hàng (bắt buộc)
    returnDate: Date;         // Ngày trả hàng (bắt buộc)
    items: [                  // Danh sách sản phẩm (bắt buộc)
        {
            costumeId: string;    // ID trang phục
            quantity: number;      // Số lượng (>0)
            price: number;         // Đơn giá (≥0)
            subtotal: number;      // Thành tiền (≥0)
        }
    ];
    total: number;           // Tổng tiền (≥0)
    deposit: number;         // Tiền đặt cọc (≥0)
    remainingAmount: number; // Số tiền còn lại (≥0)
    status?: string;        // Trạng thái (mặc định: "pending")
    note?: string;          // Ghi chú
}
```

### Example Request / Ví dụ

```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0123456789",
  "customerEmail": "nguyenvana@email.com",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "orderDate": "2024-03-20T00:00:00.000Z",
  "returnDate": "2024-03-25T00:00:00.000Z",
  "items": [
    {
      "costumeId": "65c8f2d48c5d6b6a0f6e1234",
      "quantity": 2,
      "price": 500000,
      "subtotal": 1000000
    }
  ],
  "total": 1000000,
  "deposit": 500000,
  "remainingAmount": 500000,
  "note": "Khách hẹn lấy đồ vào buổi sáng"
}
```

### Success Response / Phản hồi thành công

```json
{
    "_id": "65c8f2d48c5d6b6a0f6e5678",
    "orderCode": "MG_000001",
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0123456789",
    "customerEmail": "nguyenvana@email.com",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "orderDate": "2024-03-20T00:00:00.000Z",
    "returnDate": "2024-03-25T00:00:00.000Z",
    "items": [...],
    "total": 1000000,
    "deposit": 500000,
    "remainingAmount": 500000,
    "status": "pending",
    "note": "Khách hẹn lấy đồ vào buổi sáng",
    "timeline": [
        {
            "date": "2024-03-20T00:00:00.000Z",
            "status": "pending",
            "note": "Tạo đơn hàng"
        }
    ],
    "createdAt": "2024-03-20T00:00:00.000Z",
    "updatedAt": "2024-03-20T00:00:00.000Z"
}
```

## 2. Get All Orders / Lấy danh sách đơn hàng

### Endpoint

```
GET /orders
```

### Query Parameters / Tham số truy vấn

```typescript
{
    page?: number;           // Trang (mặc định: 1)
    limit?: number;          // Số lượng mỗi trang (mặc định: 10)
    search?: string;         // Tìm kiếm theo mã đơn/tên/SĐT
    status?: string;         // Lọc theo trạng thái
    startDate?: Date;        // Lọc từ ngày
    endDate?: Date;          // Lọc đến ngày
    sortBy?: string;         // Sắp xếp theo trường (mặc định: createdAt)
    sortOrder?: 'asc'|'desc'; // Thứ tự sắp xếp (mặc định: desc)
}
```

### Example / Ví dụ

```
GET /orders?page=1&limit=10&status=pending&search=0123456789
```

### Success Response / Phản hồi thành công

```json
{
  "data": [
    {
      "_id": "65c8f2d48c5d6b6a0f6e5678",
      "orderCode": "MG_000001"
      // ... other order fields
    }
  ],
  "total": 100
}
```

## 3. Get Order Details / Xem chi tiết đơn hàng

### Endpoint

```
GET /orders/{id}
```

### Success Response / Phản hồi thành công

```json
{
  "_id": "65c8f2d48c5d6b6a0f6e5678",
  "orderCode": "MG_000001"
  // ... full order details
}
```

## 4. Update Order / Cập nhật đơn hàng

### Endpoint

```
PATCH /orders/{id}
```

### Request Body / Dữ liệu gửi đi

```typescript
{
    status?: string;        // Cập nhật trạng thái
    returnDate?: Date;      // Cập nhật ngày trả
    deposit?: number;       // Cập nhật tiền cọc
    note?: string;         // Cập nhật ghi chú
    // ... other updateable fields
}
```

## 5. Delete Order / Xóa đơn hàng

### Endpoint

```
DELETE /orders/{id}
```

## Error Responses / Phản hồi lỗi

### Validation Error / Lỗi dữ liệu

```json
{
  "statusCode": 400,
  "message": [
    "Tên khách hàng không được để trống",
    "Số điện thoại không hợp lệ",
    "Ngày trả phải sau ngày đặt hàng"
  ],
  "error": "Bad Request"
}
```

### Not Found / Không tìm thấy

```json
{
  "statusCode": 404,
  "message": "Không tìm thấy đơn hàng",
  "error": "Not Found"
}
```

### Order Status Flow / Luồng trạng thái đơn hàng

```
PENDING (Chờ xử lý) -> ACTIVE (Đang thuê) -> COMPLETED (Hoàn thành)
                    -> CANCELLED (Đã hủy)
```

## Notes / Lưu ý

1. Khi tạo đơn hàng:

   - Hệ thống tự động tạo mã đơn hàng
   - Nếu khách hàng chưa tồn tại, hệ thống sẽ tự động tạo mới
   - Số lượng trang phục sẽ được kiểm tra và cập nhật tự động
   - Ngày trả phải sau ngày đặt

2. Khi cập nhật đơn hàng:

   - Mỗi thay đổi trạng thái sẽ được ghi lại trong timeline
   - Không thể thay đổi mã đơn hàng
   - Cần có quyền admin hoặc staff

3. Xóa đơn hàng:
   - Chỉ admin mới có quyền xóa
   - Nên cân nhắc sử dụng hủy đơn thay vì xóa
