/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseServices from '../baseServices';
import Category from './category.model';
import { fashionCategories } from '../../constant/fashionCatalog';
import CustomError from '../../errors/customError';
import { Types } from 'mongoose';

class CategoryServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string) {
    for (const name of fashionCategories) {
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
    if (existing) throw new CustomError(409, 'Category already exists');
    return this.model.create({ user: userId, name });
  }
}

const categoryServices = new CategoryServices(Category, 'Category');
export default categoryServices;
