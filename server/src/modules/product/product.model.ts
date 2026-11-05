
import { Schema, model } from 'mongoose';
import { IProduct } from './product.interface';

const variantSchema = new Schema(
  {
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    sku: { type: String },
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'user',
    },
    seller: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Seller',
    },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'category',
    },
    name: { type: String, required: true },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: (variants: unknown[]) => variants.length > 0,
        message: 'At least one product variant is required',
      },
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'brand',
    },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  this.stock = this.variants.reduce(
    (total, variant) => total + variant.stock,
    0
  );
  next();
});

const Product = model<IProduct>('product', productSchema);

export default Product;
