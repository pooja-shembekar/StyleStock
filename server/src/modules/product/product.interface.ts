
import { Types } from 'mongoose';

export interface IProductVariant {
  size: string;
  color: string;
  stock: number;
  lowStockThreshold: number;
  sku?: string;
  _id?: Types.ObjectId;
}

export interface IProduct {
  user: Types.ObjectId;
  name: string;
  seller: Types.ObjectId;
  category: Types.ObjectId;
  brand?: Types.ObjectId;
  variants: IProductVariant[];
  price: number;
  stock: number;
  description?: string;
  images?: string[];
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
