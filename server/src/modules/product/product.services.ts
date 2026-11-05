/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Product from './product.model';
import matchStagePipeline from './product.aggregation.pipeline';
import CustomError from '../../errors/customError';
import Purchase from '../purchase/purchase.model';
import Seller from '../seller/seller.model';
import { IProduct } from './product.interface';
import ProductNote from './productNote.model';
import StockMovement from './stockMovement.model';

class ProductServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new product
   */
  async create(payload: IProduct, userId: string) {
    const productPayload = { ...payload, user: new Types.ObjectId(userId) };
    if (!productPayload.brand) delete productPayload.brand;
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const seller = await Seller.findOne({ _id: productPayload.seller, user: userId }).session(session);
      if (!seller) throw new CustomError(404, 'Seller is not found');
      const [product] = await this.model.create([productPayload], { session });
      const purchases = product.variants
        .filter((variant: any) => variant.stock > 0)
        .map((variant: any) => ({
          user: userId,
          seller: product.seller,
          product: product._id,
          variantId: variant._id,
          variantSize: variant.size,
          variantColor: variant.color,
          sellerName: seller.name,
          productName: product.name,
          quantity: variant.stock,
          unitPrice: product.price,
          totalPrice: variant.stock * product.price,
        }));
      const createdPurchases = purchases.length ? await Purchase.create(purchases, { session }) : [];
      const initialMovements = product.variants
        .filter((variant: any) => variant.stock > 0)
        .map((variant: any) => ({
          user: new Types.ObjectId(userId),
          product: product._id,
          variantId: variant._id,
          variantSize: variant.size,
          variantColor: variant.color,
          variantSku: variant.sku,
          type: 'initial_stock',
          previousStock: 0,
          quantityChanged: variant.stock,
          newStock: variant.stock,
          reason: 'Initial stock recorded when product was created',
          referenceId: createdPurchases.find(
            (purchase: any) => purchase.variantId.toString() === variant._id.toString(),
          )?._id ?? product._id,
          performedBy: new Types.ObjectId(userId),
        }));
      if (initialMovements.length) await StockMovement.create(initialMovements, { session });

      await session.commitTransaction();

      return product;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Count Total Product
   */
  async countTotalProduct(userId: string) {
    return this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$stock' }
        }
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          totalQuantity: 1
        }
      }
    ]);
  }

  /**
   * Get All product of user
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    let data = await this.model.aggregate([...matchStagePipeline(query, userId), ...sortAndPaginatePipeline(query)]);

    const totalCount = await this.model.aggregate([
      ...matchStagePipeline(query, userId),
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    data = await this.model.populate(data, { path: 'category', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'brand', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'seller', select: '-__v -user -createdAt -updatedAt' });

    return { data, totalCount };
  }

  async getLowStock(userId: string) {
    return this.model.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      { $unwind: '$variants' },
      {
        $match: {
          $expr: {
            $lte: ['$variants.stock', { $ifNull: ['$variants.lowStockThreshold', 5] }],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          variant: '$variants',
        },
      },
    ]);
  }

  /**
   * Get Single product of user
   */
  async read(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid product ID');
    const product = await this.model
      .findOne({ user: new Types.ObjectId(userId), _id: id })
      .populate('category', '-__v -user')
      .populate('brand', '-__v -user')
      .populate('seller', '-__v -user -createdAt -updatedAt');
    if (!product) throw new CustomError(404, 'Product is not found');
    return product;
  }

  /**
   * Multiple delete
   */
  async bulkDelete(payload: string[], userId: string) {
    const data = payload.map((item) => new Types.ObjectId(item));

    return this.model.deleteMany({ _id: { $in: data }, user: new Types.ObjectId(userId) });
  }

  async update(id: string, payload: Partial<IProduct>, userId?: string) {
    if (!userId) throw new CustomError(401, 'Authentication is required');
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid product ID');
    const updatePayload = { ...payload };
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const existingProduct = await this.model
        .findOne({ _id: id, user: new Types.ObjectId(userId) })
        .session(session);
      if (!existingProduct) throw new CustomError(404, 'Product is not found');

    if (updatePayload.variants) {
      updatePayload.stock = updatePayload.variants.reduce((total, variant) => total + variant.stock, 0);
    } else {
      delete updatePayload.stock;
    }
      const updatedProduct = await this.model.findOneAndUpdate(
        { _id: id, user: new Types.ObjectId(userId) },
        { $set: updatePayload },
        { new: true, runValidators: true, session },
      );
      if (!updatedProduct) throw new CustomError(404, 'Product is not found');

      if (payload.variants) {
        const previousVariants = new Map(
          existingProduct.variants.map((variant: any) => [variant._id.toString(), variant]),
        );
        const nextVariantIds = new Set<string>();
        const movements = updatedProduct.variants.flatMap((variant: any) => {
          const variantId = variant._id.toString();
          nextVariantIds.add(variantId);
          const previousVariant = previousVariants.get(variantId) as any | undefined;
          const previousStock = previousVariant?.stock ?? 0;
          const quantityChanged = variant.stock - previousStock;
          if (quantityChanged === 0) return [];

          return [{
            user: new Types.ObjectId(userId),
            product: updatedProduct._id,
            variantId: variant._id,
            variantSize: variant.size,
            variantColor: variant.color,
            variantSku: variant.sku,
            type: previousVariant ? 'adjustment' : 'initial_stock',
            previousStock,
            quantityChanged,
            newStock: variant.stock,
            reason: previousVariant
              ? 'Variant stock changed during product edit'
              : 'Initial stock recorded for a new variant',
            referenceId: updatedProduct._id,
            performedBy: new Types.ObjectId(userId),
          }];
        });

        existingProduct.variants.forEach((variant: any) => {
          if (nextVariantIds.has(variant._id.toString()) || variant.stock === 0) return;
          movements.push({
            user: new Types.ObjectId(userId),
            product: updatedProduct._id,
            variantId: variant._id,
            variantSize: variant.size,
            variantColor: variant.color,
            variantSku: variant.sku,
            type: 'adjustment',
            previousStock: variant.stock,
            quantityChanged: -variant.stock,
            newStock: 0,
            reason: 'Variant removed during product edit',
            referenceId: updatedProduct._id,
            performedBy: new Types.ObjectId(userId),
          });
        });
        if (movements.length) await StockMovement.create(movements, { session });
      }

      await session.commitTransaction();
      return updatedProduct;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async addToStock(
    id: string,
    payload: { variantId: string; stock: number },
    userId: string,
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const product: any = await this.model.findOneAndUpdate(
        {
          _id: id,
          user: new Types.ObjectId(userId),
          'variants._id': payload.variantId,
        },
        {
          $inc: {
            'variants.$.stock': payload.stock,
            stock: payload.stock,
          },
        },
        { new: true, session },
      );
      if (!product) throw new CustomError(404, 'Product variant is not found');

      const variant = product.variants.id(payload.variantId);
      const seller = await Seller.findOne({ _id: product.seller, user: userId }).session(session);
      if (!seller) throw new CustomError(404, 'Seller is not found');
      const [purchase] = await Purchase.create(
        [
          {
            user: userId,
            seller: product.seller,
            product: product._id,
            variantId: variant._id,
            variantSize: variant.size,
            variantColor: variant.color,
            sellerName: seller.name,
            productName: product.name,
            quantity: payload.stock,
            unitPrice: product.price,
            totalPrice: payload.stock * product.price,
          }
        ],
        { session }
      );
      await StockMovement.create(
        [{
          user: new Types.ObjectId(userId),
          product: product._id,
          variantId: variant._id,
          variantSize: variant.size,
          variantColor: variant.color,
          variantSku: variant.sku,
          type: 'purchase',
          previousStock: variant.stock - payload.stock,
          quantityChanged: payload.stock,
          newStock: variant.stock,
          reason: 'Stock added through product management',
          referenceId: purchase._id,
          performedBy: new Types.ObjectId(userId),
        }],
        { session },
      );

      await session.commitTransaction();

      return product;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getStockMovements(id: string, query: Record<string, unknown>, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid product ID');
    const product = await this.model.findOne({ _id: id, user: new Types.ObjectId(userId) }).select('_id');
    if (!product) throw new CustomError(404, 'Product is not found');

    const requestedPage = Number(query.page);
    const requestedLimit = Number(query.limit);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 10;
    const filter: Record<string, unknown> = {
      user: new Types.ObjectId(userId),
      product: product._id,
    };

    if (query.variantId) {
      if (!Types.ObjectId.isValid(query.variantId as string)) {
        throw new CustomError(400, 'Invalid product variant ID');
      }
      filter.variantId = new Types.ObjectId(query.variantId as string);
    }
    if (query.type) {
      const allowedTypes = ['initial_stock', 'purchase', 'sale', 'return', 'adjustment'];
      if (!allowedTypes.includes(query.type as string)) throw new CustomError(400, 'Invalid stock movement type');
      filter.type = query.type;
    }

    const [data, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async getNotes(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid product ID');
    const product = await this.model.findOne({ _id: id, user: new Types.ObjectId(userId) }).select('_id');
    if (!product) throw new CustomError(404, 'Product is not found');

    return ProductNote.find({ user: new Types.ObjectId(userId), product: product._id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createNote(id: string, body: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid product ID');
    const product = await this.model.findOne({ _id: id, user: new Types.ObjectId(userId) }).select('_id');
    if (!product) throw new CustomError(404, 'Product is not found');

    const note = await ProductNote.create({
      user: new Types.ObjectId(userId),
      product: product._id,
      author: new Types.ObjectId(userId),
      body,
    });
    return ProductNote.findById(note._id).populate('author', 'name email').lean();
  }

  async deleteNote(id: string, noteId: string, userId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(noteId)) {
      throw new CustomError(400, 'Invalid product or note ID');
    }
    const deleted = await ProductNote.deleteOne({
      _id: new Types.ObjectId(noteId),
      product: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
      author: new Types.ObjectId(userId),
    });
    if (!deleted.deletedCount) throw new CustomError(404, 'Note is not found or cannot be deleted');
    return deleted;
  }
}

const productServices = new ProductServices(Product, 'Product');
export default productServices;
