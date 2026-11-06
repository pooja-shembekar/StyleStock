import BaseServices from '../baseServices';
import Brand from './brand.model';
import { fashionBrands } from '../../constant/fashionCatalog';
import CustomError from '../../errors/customError';
import { Types, UpdateQuery } from 'mongoose';
import { IBrand } from './brand.interface';

class BrandServices extends BaseServices<IBrand> {
  constructor() {
    super(Brand, 'Brand');
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

  async update(id: string, payload: { name?: string }, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid Brand ID');
    const name = payload.name?.trim();
    if (name) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const duplicate = await this.model.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        user: new Types.ObjectId(userId),
        name: { $regex: `^${escapedName}$`, $options: 'i' }
      });
      if (duplicate) throw new CustomError(409, 'Brand already exists');
      return super.update(id, { $set: { name } } as UpdateQuery<IBrand>, userId);
    }

    return super.update(id, {} as UpdateQuery<IBrand>, userId);
  }
}

const brandServices = new BrandServices();
export default brandServices;
