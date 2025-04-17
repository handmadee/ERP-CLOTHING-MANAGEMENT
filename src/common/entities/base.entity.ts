import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class BaseEntity {
  @ApiProperty({ description: 'Created date' })
  @Prop({ default: Date.now })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  @Prop({ default: Date.now })
  updatedAt: Date;

  @ApiProperty({ description: 'Deleted date' })
  @Prop({ default: null })
  deletedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  @Prop()
  createdBy?: string;

  @ApiProperty({ description: 'Updated by user ID' })
  @Prop()
  updatedBy?: string;

  @ApiProperty({ description: 'Deleted by user ID' })
  @Prop()
  deletedBy?: string;

  @ApiProperty({ description: 'Is the record active' })
  @Prop({ default: true })
  isActive: boolean;
} 