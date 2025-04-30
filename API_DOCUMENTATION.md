# Tài liệu API Quản lý Trang phục và Danh mục

## Xác thực

Tất cả các API (trừ khi được đánh dấu `Public`) yêu cầu xác thực bằng JWT token.

**Header**:

```
Authorization: Bearer {token}
```

## I. Quản lý Danh mục (Categories)

### 1. Lấy tất cả danh mục

**Endpoint**: `GET/categories`

**Mô tả**: Lấy danh sách tất cả danh mục trang phục

**Response**:

```json
[
  {
    "_id": "65e7a12c1d409d8df03f2b0a",
    "name": "Váy cưới",
    "color": "#e91e63",
    "description": "Bộ sưu tập váy cưới cao cấp",
    "createdAt": "2024-03-06T07:45:16.453Z",
    "updatedAt": "2024-03-06T07:45:16.453Z"
  }
  // ...
]
```

### 2. Lấy danh mục theo ID

**Endpoint**: `GET/categories/{id}`

**Params**:

- `id`: ID của danh mục cần lấy

**Response**:

```json
{
  "_id": "65e7a12c1d409d8df03f2b0a",
  "name": "Váy cưới",
  "color": "#e91e63",
  "description": "Bộ sưu tập váy cưới cao cấp",
  "createdAt": "2024-03-06T07:45:16.453Z",
  "updatedAt": "2024-03-06T07:45:16.453Z"
}
```

### 3. Tạo danh mục mới

**Endpoint**: `POST/categories`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Request Body**:

```json
{
  "name": "Váy cưới",
  "color": "#e91e63",
  "description": "Bộ sưu tập váy cưới cao cấp"
}
```

**Response**:

```json
{
  "_id": "65e7a12c1d409d8df03f2b0a",
  "name": "Váy cưới",
  "color": "#e91e63",
  "description": "Bộ sưu tập váy cưới cao cấp",
  "createdAt": "2024-03-06T07:45:16.453Z",
  "updatedAt": "2024-03-06T07:45:16.453Z"
}
```

### 4. Cập nhật danh mục

**Endpoint**: `PATCH/categories/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của danh mục cần cập nhật

**Request Body**:

```json
{
  "name": "Váy cưới cao cấp",
  "color": "#d81b60",
  "description": "Bộ sưu tập váy cưới cao cấp đến từ các thương hiệu nổi tiếng"
}
```

_Lưu ý: Chỉ cần gửi các trường cần cập nhật_

**Response**:

```json
{
  "_id": "65e7a12c1d409d8df03f2b0a",
  "name": "Váy cưới cao cấp",
  "color": "#d81b60",
  "description": "Bộ sưu tập váy cưới cao cấp đến từ các thương hiệu nổi tiếng",
  "createdAt": "2024-03-06T07:45:16.453Z",
  "updatedAt": "2024-03-06T08:30:22.781Z"
}
```

### 5. Xóa danh mục

**Endpoint**: `DELETE/categories/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của danh mục cần xóa

**Response**: 204 No Content (xóa thành công)

## II. Quản lý Trang phục (Costumes)

### 1. Lấy danh sách trang phục (có lọc và phân trang)

**Endpoint**: `GET/costumes`

**Query Parameters**:

- `code`: Tìm theo mã sản phẩm (không phân biệt hoa thường)
- `name`: Tìm theo tên trang phục (không phân biệt hoa thường)
- `categoryId`: Lọc theo ID danh mục
- `status`: Lọc theo trạng thái (`available`, `rented`, `maintenance`)
- `sortBy`: Sắp xếp theo trường (`name`, `price`, `createdAt`)
- `sortOrder`: Thứ tự sắp xếp (`ASC`, `DESC`)
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng item trên trang (mặc định: 10)

**Response**:

```json
{
  "items": [
    {
      "_id": "65e7a2581d409d8df03f2b0c",
      "code": "SP7G23YF",
      "name": "Váy cưới công chúa",
      "categoryId": "65e7a12c1d409d8df03f2b0a",
      "category": {
        "_id": "65e7a12c1d409d8df03f2b0a",
        "name": "Váy cưới",
        "color": "#e91e63"
      },
      "price": 5000000,
      "size": "S, M, L",
      "status": "available",
      "imageUrl": "https://example.com/images/wedding_dress1.jpg",
      "description": "Váy cưới phong cách công chúa với chất liệu ren cao cấp",
      "quantityAvailable": 3,
      "quantityRented": 2,
      "createdAt": "2024-03-06T07:49:44.123Z",
      "updatedAt": "2024-03-06T07:49:44.123Z"
    }
    // ...
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

### 2. Lấy trang phục theo ID

**Endpoint**: `GET/costumes/{id}`

**Params**:

- `id`: ID của trang phục

**Response**:

```json
{
  "_id": "65e7a2581d409d8df03f2b0c",
  "code": "SP7G23YF",
  "name": "Váy cưới công chúa",
  "categoryId": "65e7a12c1d409d8df03f2b0a",
  "category": {
    "_id": "65e7a12c1d409d8df03f2b0a",
    "name": "Váy cưới",
    "color": "#e91e63"
  },
  "price": 5000000,
  "size": "S, M, L",
  "status": "available",
  "imageUrl": "https://example.com/images/wedding_dress1.jpg",
  "description": "Váy cưới phong cách công chúa với chất liệu ren cao cấp",
  "quantityAvailable": 3,
  "quantityRented": 2,
  "createdAt": "2024-03-06T07:49:44.123Z",
  "updatedAt": "2024-03-06T07:49:44.123Z"
}
```

### 3. Lấy trang phục theo mã sản phẩm

**Endpoint**: `GET/costumes/code/{code}`

**Params**:

- `code`: Mã sản phẩm

**Response**: Giống response của API lấy theo ID

### 4. Tạo trang phục mới

**Endpoint**: `POST/costumes`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Request Body**:

```json
{
  "name": "Váy cưới đuôi cá",
  "categoryId": "65e7a12c1d409d8df03f2b0a",
  "price": 6500000,
  "size": "S, M",
  "status": "available",
  "imageUrl": "https://example.com/images/mermaid_dress.jpg",
  "description": "Váy cưới đuôi cá ôm dáng, tôn lên vóc dáng cô dâu",
  "quantityAvailable": 2,
  "quantityRented": 0
}
```

_Lưu ý: Mã sản phẩm (code) sẽ tự động được tạo nếu không cung cấp_

**Response**:

```json
{
  "_id": "65e7a5121d409d8df03f2b0e",
  "code": "SP8H4T2M",
  "name": "Váy cưới đuôi cá",
  "categoryId": "65e7a12c1d409d8df03f2b0a",
  "price": 6500000,
  "size": "S, M",
  "status": "available",
  "imageUrl": "https://example.com/images/mermaid_dress.jpg",
  "description": "Váy cưới đuôi cá ôm dáng, tôn lên vóc dáng cô dâu",
  "quantityAvailable": 2,
  "quantityRented": 0,
  "createdAt": "2024-03-06T08:01:22.453Z",
  "updatedAt": "2024-03-06T08:01:22.453Z"
}
```

### 5. Cập nhật trang phục

**Endpoint**: `PATCH/costumes/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của trang phục cần cập nhật

**Request Body**:

```json
{
  "price": 7000000,
  "description": "Váy cưới đuôi cá ôm dáng, tôn lên vóc dáng cô dâu, thiết kế sang trọng",
  "quantityAvailable": 3
}
```

_Lưu ý: Chỉ cần gửi các trường cần cập nhật_

**Response**:

```json
{
  "_id": "65e7a5121d409d8df03f2b0e",
  "code": "SP8H4T2M",
  "name": "Váy cưới đuôi cá",
  "categoryId": "65e7a12c1d409d8df03f2b0a",
  "price": 7000000,
  "size": "S, M",
  "status": "available",
  "imageUrl": "https://example.com/images/mermaid_dress.jpg",
  "description": "Váy cưới đuôi cá ôm dáng, tôn lên vóc dáng cô dâu, thiết kế sang trọng",
  "quantityAvailable": 3,
  "quantityRented": 0,
  "createdAt": "2024-03-06T08:01:22.453Z",
  "updatedAt": "2024-03-06T08:15:44.781Z"
}
```

### 6. Xóa trang phục

**Endpoint**: `DELETE/costumes/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của trang phục cần xóa

**Response**: 204 No Content (xóa thành công)

### 7. Thống kê trang phục theo trạng thái

**Endpoint**: `GET/costumes/stats/by-status`

**Response**:

```json
[
  {
    "status": "available",
    "count": 30
  },
  {
    "status": "rented",
    "count": 15
  },
  {
    "status": "maintenance",
    "count": 5
  }
]
```

### 8. Thống kê trang phục theo danh mục

**Endpoint**: `GET/costumes/stats/by-category`

**Response**:

```json
[
  {
    "categoryId": "65e7a12c1d409d8df03f2b0a",
    "categoryName": "Váy cưới",
    "count": 25
  },
  {
    "categoryId": "65e7a13f1d409d8df03f2b0b",
    "categoryName": "Áo dài",
    "count": 15
  }
  // ...
]
```

## III. Quản lý Hình ảnh (Images)

### 1. Tải lên hình ảnh

**Endpoint**: `POST /api/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Content-Type**: `multipart/form-data`

**Request Body**:

- `file`: File hình ảnh (jpg, jpeg, png, gif, webp)
- `entityId` (tùy chọn): ID của thực thể liên quan
- `entityType` (tùy chọn): Loại thực thể liên quan (costume, category)
- `compress` (tùy chọn): Nén hình ảnh (mặc định: true)

**Response**:

```json
{
  "_id": "60a6f75c9f546d429c3a11d8",
  "originalName": "wedding_dress.jpg",
  "filename": "6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "path": "uploads/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "mimetype": "image/jpeg",
  "size": 1048576,
  "status": "processing",
  "compressed": false,
  "url": "http://localhost:3000/api/images/file/6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "entityId": "60a6f75c9f546d429c3a11e9",
  "entityType": "costume",
  "createdAt": "2023-10-15T08:30:00.000Z",
  "updatedAt": "2023-10-15T08:30:00.000Z"
}
```

### 2. Tải lên hình ảnh cho trang phục

**Endpoint**: `POST /api/costumes/{id}/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Content-Type**: `multipart/form-data`

**Params**:

- `id`: ID của trang phục

**Request Body**:

- `file`: File hình ảnh (jpg, jpeg, png, gif, webp)

**Response**: Giống như response của API tải lên hình ảnh

### 3. Tải lên hình ảnh cho danh mục

**Endpoint**: `POST /api/categories/{id}/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Content-Type**: `multipart/form-data`

**Params**:

- `id`: ID của danh mục

**Request Body**:

- `file`: File hình ảnh (jpg, jpeg, png, gif, webp)

**Response**: Giống như response của API tải lên hình ảnh

### 4. Lấy danh sách hình ảnh

**Endpoint**: `GET /api/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Query Parameters** (tùy chọn):

- `entityId`: Lọc theo ID thực thể liên quan
- `entityType`: Lọc theo loại thực thể (costume, category)
- `status`: Lọc theo trạng thái xử lý
- `compressed`: Lọc theo trạng thái nén

**Response**:

```json
[
  {
    "_id": "60a6f75c9f546d429c3a11d8",
    "originalName": "wedding_dress.jpg",
    "filename": "compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
    "path": "uploads/compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
    "mimetype": "image/jpeg",
    "size": 524288,
    "status": "completed",
    "compressed": true,
    "url": "http://localhost:3000/api/images/file/compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
    "entityId": "60a6f75c9f546d429c3a11e9",
    "entityType": "costume",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "originalSize": 1048576,
      "compressedSize": 524288,
      "compressionRatio": "50%",
      "compressionQuality": 80
    },
    "createdAt": "2023-10-15T08:30:00.000Z",
    "updatedAt": "2023-10-15T08:35:00.000Z"
  }
  // ...
]
```

### 5. Lấy hình ảnh của trang phục

**Endpoint**: `GET /api/costumes/{id}/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của trang phục

**Response**: Danh sách hình ảnh (giống như response của API lấy danh sách hình ảnh)

### 6. Lấy hình ảnh của danh mục

**Endpoint**: `GET /api/categories/{id}/images`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của danh mục

**Response**: Danh sách hình ảnh (giống như response của API lấy danh sách hình ảnh)

### 7. Lấy thông tin hình ảnh theo ID

**Endpoint**: `GET /api/images/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của hình ảnh

**Response**:

```json
{
  "_id": "60a6f75c9f546d429c3a11d8",
  "originalName": "wedding_dress.jpg",
  "filename": "compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "path": "uploads/compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "mimetype": "image/jpeg",
  "size": 524288,
  "status": "completed",
  "compressed": true,
  "url": "http://localhost:3000/api/images/file/compressed_6c84fb90-12c4-11e1-840d-7b25c5ee775a.jpg",
  "entityId": "60a6f75c9f546d429c3a11e9",
  "entityType": "costume",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "originalSize": 1048576,
    "compressedSize": 524288,
    "compressionRatio": "50%",
    "compressionQuality": 80
  },
  "createdAt": "2023-10-15T08:30:00.000Z",
  "updatedAt": "2023-10-15T08:35:00.000Z"
}
```

### 8. Xem hình ảnh

**Endpoint**: `GET /api/images/file/{filename}`

**Quyền hạn**: Public (không yêu cầu xác thực)

**Params**:

- `filename`: Tên file của hình ảnh (từ trường filename trong response)

**Response**: Stream hình ảnh với Content-Type phù hợp

### 9. Nén hình ảnh

**Endpoint**: `PATCH /api/images/{id}/compress`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của hình ảnh

**Response**: Thông tin hình ảnh sau khi nén

### 10. Liên kết hình ảnh với thực thể

**Endpoint**: `PATCH /api/images/{id}/link`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của hình ảnh

**Request Body**:

```json
{
  "entityId": "60a6f75c9f546d429c3a11e9",
  "entityType": "costume"
}
```

**Response**: Thông tin hình ảnh sau khi liên kết

### 11. Xóa hình ảnh

**Endpoint**: `DELETE /api/images/{id}`

**Quyền hạn**: ADMIN, SUPER_ADMIN

**Params**:

- `id`: ID của hình ảnh

**Response**: 204 No Content (xóa thành công)

## Mã lỗi

- **400** - Bad Request: Dữ liệu không hợp lệ hoặc không thể thực hiện thao tác
- **401** - Unauthorized: Không có token hoặc token không hợp lệ/hết hạn
- **403** - Forbidden: Không có quyền truy cập (quyền không đủ)
- **404** - Not Found: Không tìm thấy tài nguyên
- **409** - Conflict: Xung đột dữ liệu (mã sản phẩm hoặc tên danh mục đã tồn tại)

_Lưu ý: Đối với frontend, nếu bạn cần thêm thông tin hoặc có bất kỳ thắc mắc nào về API, vui lòng liên hệ với team backend._
