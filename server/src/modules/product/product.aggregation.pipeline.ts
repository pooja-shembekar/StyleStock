/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import CustomError from '../../errors/customError';
import { escapeRegex, getSearchTerm } from '../../lib/queryUtils';

const matchStagePipeline = (query: Record<string, unknown>, userId: string) => {
  let minPrice = 0;
  let maxPrice = Number.MAX_VALUE;

  if (query.minPrice !== undefined && query.minPrice !== '') {
    if (typeof query.minPrice !== 'string' && typeof query.minPrice !== 'number') {
      throw new CustomError(400, 'Invalid product price range');
    }
    minPrice = Number(query.minPrice);
  }
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    if (typeof query.maxPrice !== 'string' && typeof query.maxPrice !== 'number') {
      throw new CustomError(400, 'Invalid product price range');
    }
    maxPrice = Number(query.maxPrice);
  }
  if (!Number.isFinite(minPrice) || minPrice < 0 || !Number.isFinite(maxPrice) || maxPrice < minPrice) {
    throw new CustomError(400, 'Invalid product price range');
  }

  const fieldQuery: any = [{ user: new Types.ObjectId(userId) }, { price: { $gte: minPrice, $lte: maxPrice } }];

  const search = getSearchTerm(query.name);
  if (search) {
    fieldQuery.push({ name: { $regex: new RegExp(escapeRegex(search), 'i') } });
  }

  if (query.category !== undefined && query.category !== '') {
    if (typeof query.category !== 'string' || !Types.ObjectId.isValid(query.category)) {
      throw new CustomError(400, 'Invalid category ID');
    }
    fieldQuery.push({ category: { $eq: new Types.ObjectId(query.category) } });
  }

  if (query.brand !== undefined && query.brand !== '') {
    if (typeof query.brand !== 'string' || !Types.ObjectId.isValid(query.brand)) {
      throw new CustomError(400, 'Invalid brand ID');
    }
    fieldQuery.push({ brand: { $eq: new Types.ObjectId(query.brand) } });
  }

  return [
    {
      $match: {
        $and: [...fieldQuery]
      }
    }
  ];
};

export default matchStagePipeline;
