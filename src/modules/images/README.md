# Images Module

## Overview

The Images Module is a comprehensive solution for handling image uploads, storage, compression, and management in the Wedding Management Backend. It provides a robust API for both internal module use and external client access.

## Features

- **Image Upload**: Secure file upload with validation and size restrictions
- **Automatic Image Compression**: Reduces file size without significant quality loss
- **Entity Association**: Link images to other entities (e.g., costumes, categories)
- **Access Control**: Role-based permissions for image management
- **Image Streaming**: Optimized delivery of images with proper caching
- **Batch Processing**: Tools for processing multiple images efficiently

## API Endpoints

### Upload an Image

- **URL**: `/api/images`
- **Method**: `POST`
- **Auth Required**: Yes (Admin, Super Admin)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Image file (jpg, jpeg, png, gif, webp)
  - `entityId`: (Optional) ID of related entity
  - `entityType`: (Optional) Type of related entity (e.g., "costume", "category")
  - `compress`: (Optional) Whether to compress the image (default: true)

### Get All Images

- **URL**: `/api/images`
- **Method**: `GET`
- **Auth Required**: Yes (Admin, Super Admin)
- **Query Parameters**:
  - `entityId`: (Optional) Filter by entity ID
  - `entityType`: (Optional) Filter by entity type
  - `status`: (Optional) Filter by status
  - `compressed`: (Optional) Filter by compression status

### Get Images for Entity

- **URL**: `/api/images/entity/:entityType/:entityId`
- **Method**: `GET`
- **Auth Required**: Yes (Admin, Super Admin)

### Get Image by ID

- **URL**: `/api/images/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Admin, Super Admin)

### Get Image File

- **URL**: `/api/images/file/:filename`
- **Method**: `GET`
- **Auth Required**: No (Public)

### Link Image to Entity

- **URL**: `/api/images/:id/link`
- **Method**: `PATCH`
- **Auth Required**: Yes (Admin, Super Admin)
- **Content-Type**: `application/json`
- **Body**:
  - `entityId`: ID of the entity
  - `entityType`: Type of entity

### Compress Image

- **URL**: `/api/images/:id/compress`
- **Method**: `PATCH`
- **Auth Required**: Yes (Admin, Super Admin)

### Batch Compress Images

- **URL**: `/api/images/batch/compress`
- **Method**: `POST`
- **Auth Required**: Yes (Admin, Super Admin)

### Delete Image

- **URL**: `/api/images/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin, Super Admin)

## Configuration

The module uses several environment variables that can be configured:

- `UPLOAD_PATH`: Directory to store uploaded files (default: './uploads')
- `BASE_URL`: Base URL for generated image URLs (default: 'http://localhost:3000')
- `COMPRESSION_QUALITY`: Quality setting for image compression (default: 80)
- `MAX_FILE_SIZE`: Maximum allowed file size in bytes (default: 5MB)

## Database Schema

The Image model includes:

- **originalName**: Original filename
- **filename**: Stored filename (UUID-based)
- **path**: File path on server
- **mimetype**: File MIME type
- **size**: File size in bytes
- **compressed**: Whether the image has been compressed
- **metadata**: Additional image information
- **status**: Processing status
- **entityId**: Associated entity ID
- **entityType**: Associated entity type
- **url**: Public URL to access the image

## Usage in Other Modules

To use the Images Module in other modules, inject the ImagesService:

```typescript
import { ImagesService } from '../images/images.service';

@Injectable()
export class YourService {
  constructor(private imagesService: ImagesService) {}

  async someMethod() {
    // Use imagesService methods
    const images = await this.imagesService.findByEntity(
      'entityId',
      'entityType',
    );
  }
}
```

## Compression

The module uses the Sharp library for efficient image processing:

- JPEG/JPG: Quality-based compression
- PNG: Quality-based compression
- WebP: Quality-based compression
- GIF: Basic optimization

The module intelligently handles compression and will revert to the original file if compression would increase file size.
