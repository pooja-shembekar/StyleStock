import { Types } from 'mongoose';

export interface ISale {
  user: Types.ObjectId;
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  variantSize: string;
  variantColor: string;
  productName: string;
  productPrice: number;
  quantity: number;
  buyerName: string;
  date: Date;
  totalPrice: number;
}
