import { model, Schema, Types } from 'mongoose';

export interface IProductNote {
  user: Types.ObjectId;
  product: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt?: Date;
}

const productNoteSchema = new Schema<IProductNote>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    product: { type: Schema.Types.ObjectId, required: true, ref: 'product' },
    author: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

productNoteSchema.index({ user: 1, product: 1, createdAt: -1 });

const ProductNote = model<IProductNote>('productNote', productNoteSchema);
export default ProductNote;
