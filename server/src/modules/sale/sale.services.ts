/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Sale from './sale.model';
import Product from '../product/product.model';
import CustomError from '../../errors/customError';
import StockMovement from '../product/stockMovement.model';

class SaleServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new sale and decrease product stock
   */
  async create(payload: any, userId: string) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const product = await Product.findOne({
        _id: payload.product,
        user: new Types.ObjectId(userId),
        'variants._id': payload.variantId,
      }).session(session);
      if (!product) throw new CustomError(404, 'Product variant is not found');
      const variant = product.variants.find((item) => item._id?.toString() === payload.variantId);
      if (!variant) throw new CustomError(404, 'Product variant is not found');
      const result = await Product.findOneAndUpdate(
        {
          _id: product._id,
          user: new Types.ObjectId(userId),
          variants: { $elemMatch: { _id: variant._id, stock: { $gte: payload.quantity } } },
        },
        { $inc: { 'variants.$.stock': -payload.quantity, stock: -payload.quantity } },
        { new: true, session },
      );
      if (!result) throw new CustomError(400, 'Selected variant does not have enough stock');

      const sale = await this.model.create(
        [
          {
            user: userId,
            product: product._id,
            variantId: variant._id,
            variantSize: variant.size,
            variantColor: variant.color,
            buyerName: payload.buyerName,
            productName: product.name,
            productPrice: product.price,
            quantity: payload.quantity,
            totalPrice: product.price * payload.quantity,
            date: payload.date,
          },
        ],
        { session },
      );
      await StockMovement.create(
        [{
          user: new Types.ObjectId(userId),
          product: product._id,
          variantId: variant._id,
          variantSize: variant.size,
          variantColor: variant.color,
          variantSku: variant.sku,
          type: 'sale',
          previousStock: variant.stock,
          quantityChanged: -payload.quantity,
          newStock: variant.stock - payload.quantity,
          reason: 'Stock deducted for a sale',
          referenceId: sale[0]._id,
          performedBy: new Types.ObjectId(userId),
        }],
        { session },
      );
      await session.commitTransaction();

      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async delete(id: string, userId?: string) {
    if (!userId) throw new CustomError(401, 'Authentication is required');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const sale = await this.model.findOne({ _id: id, user: new Types.ObjectId(userId) }).session(session);
      if (!sale) throw new CustomError(404, 'Sale is not found');

      if (sale.variantId) {
        const restoredProduct = await Product.findOneAndUpdate(
          {
            _id: sale.product,
            user: new Types.ObjectId(userId),
            'variants._id': sale.variantId,
          },
          { $inc: { 'variants.$.stock': sale.quantity, stock: sale.quantity } },
          { session },
        );
        if (!restoredProduct) throw new CustomError(404, 'Sale product variant is not found');
        const variant = restoredProduct.variants.find(
          (item) => item._id?.toString() === sale.variantId.toString(),
        );
        if (!variant) throw new CustomError(404, 'Sale product variant is not found');
        await StockMovement.create(
          [{
            user: new Types.ObjectId(userId),
            product: sale.product,
            variantId: sale.variantId,
            variantSize: sale.variantSize,
            variantColor: sale.variantColor,
            type: 'return',
            previousStock: variant.stock,
            quantityChanged: sale.quantity,
            newStock: variant.stock + sale.quantity,
            reason: 'Stock returned after sale deletion',
            referenceId: sale._id,
            performedBy: new Types.ObjectId(userId),
          }],
          { session },
        );
      }

      await sale.deleteOne({ session });
      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, payload: any, userId?: string) {
    if (!userId) throw new CustomError(401, 'Authentication is required');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const sale = await this.model.findOne({ _id: id, user: new Types.ObjectId(userId) }).session(session);
      if (!sale) throw new CustomError(404, 'Sale is not found');

      const quantity = payload.quantity === undefined ? sale.quantity : payload.quantity;
      const difference = quantity - sale.quantity;
      if (difference && !sale.variantId) {
        throw new CustomError(400, 'This legacy sale has no variant and cannot change quantity');
      }
      let previousStock: number | undefined;
      let variantDetails: { size: string; color: string; sku?: string } | undefined;
      if (difference > 0) {
        const product = await Product.findOne({
          _id: sale.product,
          user: new Types.ObjectId(userId),
          'variants._id': sale.variantId,
        }).session(session);
        const variant = product?.variants.find(
          (item) => item._id?.toString() === sale.variantId.toString(),
        );
        if (!variant) throw new CustomError(404, 'Sale product variant is not found');
        previousStock = variant.stock;
        variantDetails = { size: variant.size, color: variant.color, sku: variant.sku };
        const deducted = await Product.findOneAndUpdate(
          {
            _id: sale.product,
            user: new Types.ObjectId(userId),
            variants: { $elemMatch: { _id: sale.variantId, stock: { $gte: difference } } },
          },
          { $inc: { 'variants.$.stock': -difference, stock: -difference } },
          { session },
        );
        if (!deducted) throw new CustomError(400, 'Selected variant does not have enough stock');
      } else if (difference < 0) {
        const product = await Product.findOne({
          _id: sale.product,
          user: new Types.ObjectId(userId),
          'variants._id': sale.variantId,
        }).session(session);
        const variant = product?.variants.find(
          (item) => item._id?.toString() === sale.variantId.toString(),
        );
        if (!variant) throw new CustomError(404, 'Sale product variant is not found');
        previousStock = variant.stock;
        variantDetails = { size: variant.size, color: variant.color, sku: variant.sku };
        const restored = await Product.findOneAndUpdate(
          { _id: sale.product, user: new Types.ObjectId(userId), 'variants._id': sale.variantId },
          { $inc: { 'variants.$.stock': -difference, stock: -difference } },
          { session },
        );
        if (!restored) throw new CustomError(404, 'Sale product variant is not found');
      }

      const productPrice = payload.price ?? sale.productPrice;
      const updatedSale = await this.model.findOneAndUpdate(
        { _id: id, user: new Types.ObjectId(userId) },
        {
          $set: {
            buyerName: payload.buyerName ?? sale.buyerName,
            date: payload.date ?? sale.date,
            productPrice,
            quantity,
            totalPrice: productPrice * quantity,
          },
        },
        { new: true, runValidators: true, session },
      );
      if (difference !== 0 && previousStock !== undefined && variantDetails) {
        await StockMovement.create(
          [{
            user: new Types.ObjectId(userId),
            product: sale.product,
            variantId: sale.variantId,
            variantSize: variantDetails.size,
            variantColor: variantDetails.color,
            variantSku: variantDetails.sku,
            type: difference > 0 ? 'sale' : 'return',
            previousStock,
            quantityChanged: -difference,
            newStock: previousStock - difference,
            reason: difference > 0
              ? 'Additional stock deducted after sale quantity update'
              : 'Stock returned after sale quantity update',
            referenceId: sale._id,
            performedBy: new Types.ObjectId(userId),
          }],
          { session },
        );
      }
      await session.commitTransaction();
      return updatedSale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   *  Get all sale
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    // const date = query.date ? query.date : null;
    const search = query.search ? (query.search as string) : '';

    const data = await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          $or: [{ productName: { $regex: search, $options: 'i' } }, { buyerName: { $regex: search, $options: 'i' } }]
        }
      },
      ...sortAndPaginatePipeline(query)
    ]);

    const totalCount = await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId)
        }
      },
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

    return { data, totalCount };
  }

  async readAllWeeks(userId: string) {
    return await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          date: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$date' },
            year: { $isoWeekYear: '$date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.week': 1
        }
      },
      {
        $project: {
          week: '$_id.week',
          year: '$_id.year',
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      }
    ]);
  }

  async readAllYearly(userId: string) {
    return await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          date: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: {
          '_id.year': 1
        }
      },
      {
        $project: {
          year: '$_id.year',
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      }
    ]);
  }

  async readAllDaily(userId: string) {
    return await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          date: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      },
      {
        $project: {
          day: '$_id.day',
          month: '$_id.month',
          year: '$_id.year',
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      }
    ]);
  }

  async readAllMonths(userId: string) {
    return await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          date: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      }
    ]);
  }

  // get single sale
  async read(id: string, userId: string) {
    await this._isExists(id);

    return this.model.findOne({ user: new Types.ObjectId(userId), _id: id }).populate({
      path: 'product',
      select: '-createdAt -updatedAt -__v'
    });
  }
}

const saleServices = new SaleServices(Sale, 'modelName');
export default saleServices;
