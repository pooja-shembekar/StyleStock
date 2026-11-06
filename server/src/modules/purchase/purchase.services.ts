/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import BaseServices from '../baseServices';
import { IPurchase } from './purchase.interface';
import Purchase from './purchase.model';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import mongoose from 'mongoose';
import Product from '../product/product.model';
import Seller from '../seller/seller.model';
import CustomError from '../../errors/customError';
import StockMovement from '../product/stockMovement.model';
import { escapeRegex, getSearchTerm } from '../../lib/queryUtils';

class PurchaseServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Record a purchase and increase only its selected variant's stock.
   */
  async create(payload: IPurchase, userId: string) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const product = await Product.findOne({
        _id: payload.product,
        user: new Types.ObjectId(userId),
        'variants._id': payload.variantId,
      }).session(session);
      if (!product) throw new CustomError(404, 'Product variant is not found');

      const variant = product.variants.find((item) => item._id?.toString() === payload.variantId?.toString());
      if (!variant) throw new CustomError(404, 'Product variant is not found');
      const totalPrice = product.price * payload.quantity;
      const paid = payload.paid ?? 0;
      if (paid > totalPrice) throw new CustomError(400, 'Paid amount cannot exceed purchase total');
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, user: new Types.ObjectId(userId), 'variants._id': variant._id },
        { $inc: { 'variants.$.stock': payload.quantity, stock: payload.quantity } },
        { new: true, session },
      );
      if (!updatedProduct) throw new CustomError(404, 'Product variant is not found');

      const seller = await Seller.findOne({ _id: product.seller, user: userId }).session(session);
      if (!seller) throw new CustomError(404, 'Seller is not found');
      const purchase = await this.model.create(
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
            quantity: payload.quantity,
            unitPrice: product.price,
            totalPrice,
            paid,
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
          type: 'purchase',
          previousStock: variant.stock,
          quantityChanged: payload.quantity,
          newStock: variant.stock + payload.quantity,
          reason: 'Stock received from purchase',
          referenceId: purchase[0]._id,
          performedBy: new Types.ObjectId(userId),
        }],
        { session },
      );
      await session.commitTransaction();
      return purchase[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, payload: Partial<IPurchase>, userId?: string) {
    if (!userId) throw new CustomError(401, 'Authentication is required');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const purchase = await this.model
        .findOne({ _id: id, user: new Types.ObjectId(userId) })
        .session(session);
      if (!purchase) throw new CustomError(404, 'Purchase is not found');

      const quantity = payload.quantity ?? purchase.quantity;
      const difference = quantity - purchase.quantity;
      if (difference && !purchase.variantId) {
        throw new CustomError(400, 'This legacy purchase has no variant and cannot change quantity');
      }
      let previousStock: number | undefined;
      let variantDetails: { size: string; color: string; sku?: string } | undefined;
      if (difference > 0) {
        const product = await Product.findOne({
          _id: purchase.product,
          user: new Types.ObjectId(userId),
          'variants._id': purchase.variantId,
        }).session(session);
        const variant = product?.variants.find(
          (item) => item._id?.toString() === purchase.variantId.toString(),
        );
        if (!variant) throw new CustomError(404, 'Purchase product variant is not found');
        previousStock = variant.stock;
        variantDetails = { size: variant.size, color: variant.color, sku: variant.sku };
        const increased = await Product.findOneAndUpdate(
          {
            _id: purchase.product,
            user: new Types.ObjectId(userId),
            'variants._id': purchase.variantId,
          },
          { $inc: { 'variants.$.stock': difference, stock: difference } },
          { session },
        );
        if (!increased) throw new CustomError(404, 'Purchase product variant is not found');
      } else if (difference < 0) {
        const product = await Product.findOne({
          _id: purchase.product,
          user: new Types.ObjectId(userId),
          'variants._id': purchase.variantId,
        }).session(session);
        const variant = product?.variants.find(
          (item) => item._id?.toString() === purchase.variantId.toString(),
        );
        if (!variant) throw new CustomError(404, 'Purchase product variant is not found');
        previousStock = variant.stock;
        variantDetails = { size: variant.size, color: variant.color, sku: variant.sku };
        const reduced = await Product.findOneAndUpdate(
          {
            _id: purchase.product,
            user: new Types.ObjectId(userId),
            variants: { $elemMatch: { _id: purchase.variantId, stock: { $gte: -difference } } },
          },
          { $inc: { 'variants.$.stock': difference, stock: difference } },
          { session },
        );
        if (!reduced) throw new CustomError(400, 'Cannot reduce the purchase below available variant stock');
      }

      const unitPrice = payload.unitPrice ?? purchase.unitPrice;
      const paid = payload.paid ?? purchase.paid;
      if (paid > quantity * unitPrice) {
        throw new CustomError(400, 'Paid amount cannot exceed purchase total');
      }
      const updatedPurchase = await this.model.findOneAndUpdate(
        { _id: id, user: new Types.ObjectId(userId) },
        {
          $set: {
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
            paid,
          },
        },
        { new: true, runValidators: true, session },
      );
      if (difference !== 0 && previousStock !== undefined && variantDetails) {
        await StockMovement.create(
          [{
            user: new Types.ObjectId(userId),
            product: purchase.product,
            variantId: purchase.variantId,
            variantSize: variantDetails.size,
            variantColor: variantDetails.color,
            variantSku: variantDetails.sku,
            type: difference > 0 ? 'purchase' : 'adjustment',
            previousStock,
            quantityChanged: difference,
            newStock: previousStock + difference,
            reason: difference > 0
              ? 'Additional stock received after purchase quantity update'
              : 'Purchase quantity reduced',
            referenceId: purchase._id,
            performedBy: new Types.ObjectId(userId),
          }],
          { session },
        );
      }
      await session.commitTransaction();
      return updatedPurchase;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async delete(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid purchase ID');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const purchase = await this.model
        .findOne({ _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) })
        .session(session);
      if (!purchase) throw new CustomError(404, 'Purchase is not found');

      if (purchase.variantId) {
        const product = await Product.findOne({
          _id: purchase.product,
          user: new Types.ObjectId(userId),
          'variants._id': purchase.variantId
        }).session(session);
        const variant = product?.variants.find(
          (item) => item._id?.toString() === purchase.variantId?.toString()
        );
        if (!product || !variant) throw new CustomError(404, 'Purchase product variant is not found');

        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            user: new Types.ObjectId(userId),
            variants: {
              $elemMatch: { _id: purchase.variantId, stock: { $gte: purchase.quantity } }
            }
          },
          {
            $inc: {
              'variants.$.stock': -purchase.quantity,
              stock: -purchase.quantity
            }
          },
          { new: true, session }
        );
        if (!updatedProduct) {
          throw new CustomError(400, 'Cannot delete this purchase because its stock has already been consumed');
        }

        const updatedVariant = updatedProduct.variants.find(
          (item) => item._id?.toString() === purchase.variantId?.toString()
        );
        if (!updatedVariant) throw new CustomError(404, 'Purchase product variant is not found');
        await StockMovement.create(
          [{
            user: new Types.ObjectId(userId),
            product: product._id,
            variantId: updatedVariant._id,
            variantSize: updatedVariant.size,
            variantColor: updatedVariant.color,
            variantSku: updatedVariant.sku,
            type: 'adjustment',
            previousStock: updatedVariant.stock + purchase.quantity,
            quantityChanged: -purchase.quantity,
            newStock: updatedVariant.stock,
            reason: 'Stock removed after purchase deletion',
            referenceId: purchase._id,
            performedBy: new Types.ObjectId(userId)
          }],
          { session }
        );
      }

      await purchase.deleteOne({ session });
      await session.commitTransaction();
      return purchase;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string, query: Record<string, unknown>) {
    const search = escapeRegex(getSearchTerm(query.search));
    const filter = {
      user: new Types.ObjectId(userId),
      $or: [{ sellerName: { $regex: search, $options: 'i' } }, { productName: { $regex: search, $options: 'i' } }]
    };

    const data = await this.model.aggregate([
      { $match: filter },
      ...sortAndPaginatePipeline(query)
    ]);

    const totalCount = await this.model.countDocuments(filter);

    return { data, totalCount };
  }
}

const purchaseServices = new PurchaseServices(Purchase, 'Purchase');
export default purchaseServices;
