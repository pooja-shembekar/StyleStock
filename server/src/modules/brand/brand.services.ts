/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseServices from '../baseServices';
import Brand from './brand.model';
import { fashionBrands } from '../../constant/fashionCatalog';
import CustomError from '../../errors/customError';
import { Types } from 'mongoose';

class BrandServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string) {
    for (const name of fashionBrands) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await this.model.findOne({
        user: new Types.ObjectId(userId),
        name: { $regex: `^${escapedName}$`, $options: 'i' },
      });
      if (!existing) await this.model.create({ user: userId, name });
    }
    return this.model.find({ user: userId });
  }

  async create(payload: { name: string }, userId: string) {
    const name = payload.name.trim();
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await this.model.findOne({
      user: new Types.ObjectId(userId),
      name: { $regex: `^${escapedName}$`, $options: 'i' },
    });
    if (existing) throw new CustomError(409, 'Brand already exists');
    return this.model.create({ user: userId, name });
  }
}

const brandServices = new BrandServices(Brand, 'Brand');
export default brandServices;
