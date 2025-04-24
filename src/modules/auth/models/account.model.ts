import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: Role, default: Role.USER })
  role: Role;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  avatar?: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Indexes for better query performance
AccountSchema.index({ email: 1 }, { unique: true });
AccountSchema.index({ role: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ createdAt: -1 });

AccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};
