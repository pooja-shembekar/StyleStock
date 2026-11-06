/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Seller from './seller.model';
import CustomError from '../../errors/customError';
import { escapeRegex, getSearchTerm } from '../../lib/queryUtils';

class SellerServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new sale and decrease product stock
   */
  async create(payload: any, userId: string) {
    payload.user = userId;
    return this.model.create(payload);
  }

  /**
   *  Get all sale
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    const search = escapeRegex(getSearchTerm(query.search));
    const filter = {
      user: new Types.ObjectId(userId),
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } }
      ]
    };

    const data = await this.model.aggregate([
      { $match: filter },
      ...sortAndPaginatePipeline(query)
    ]);

    const totalCount = await this.model.aggregate([
      { $match: filter },
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

  // get single sale
  async read(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid seller ID');
    const seller = await this.model.findOne({ user: new Types.ObjectId(userId), _id: id });
    if (!seller) throw new CustomError(404, 'Seller is not found');
    return seller;
  }
}

const sellerServices = new SellerServices(Seller, 'seller');
export default sellerServices;
