import { model, Schema, Types } from 'mongoose';

export type StockMovementType = 'initial_stock' | 'purchase' | 'sale' | 'return' | 'adjustment';

export interface IStockMovement {
  user: Types.ObjectId;
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  variantSize: string;
  variantColor: string;
  variantSku?: string;
  type: StockMovementType;
  previousStock: number;
  quantityChanged: number;
  newStock: number;
  reason: string;
  referenceId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  createdAt?: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    product: { type: Schema.Types.ObjectId, required: true, ref: 'product' },
    variantId: { type: Schema.Types.ObjectId, required: true },
    variantSize: { type: String, required: true },
    variantColor: { type: String, required: true },
    variantSku: { type: String },
    type: {
      type: String,
      enum: ['initial_stock', 'purchase', 'sale', 'return', 'adjustment'],
      required: true,
    },
    previousStock: { type: Number, required: true, min: 0 },
    quantityChanged: { type: Number, required: true },
    newStock: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    referenceId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
  },
  { timestamps: true },
);

stockMovementSchema.index({ user: 1, product: 1, createdAt: -1 });

const StockMovement = model<IStockMovement>('stockMovement', stockMovementSchema);
export default StockMovement;
