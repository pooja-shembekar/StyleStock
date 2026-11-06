import BaseServices from '../baseServices';
import Category from './category.model';
import { fashionCategories } from '../../constant/fashionCatalog';
import CustomError from '../../errors/customError';
import { Types, UpdateQuery } from 'mongoose';
import { ICategory } from './category.interface';

class CategoryServices extends BaseServices<ICategory> {
  constructor() {
    super(Category, 'Category');
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

  async update(id: string, payload: { name?: string }, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new CustomError(400, 'Invalid Category ID');
    const name = payload.name?.trim();
    if (name) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const duplicate = await this.model.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        user: new Types.ObjectId(userId),
        name: { $regex: `^${escapedName}$`, $options: 'i' }
      });
      if (duplicate) throw new CustomError(409, 'Category already exists');
      return super.update(id, { $set: { name } } as UpdateQuery<ICategory>, userId);
    }

    return super.update(id, {} as UpdateQuery<ICategory>, userId);
  }
}

const categoryServices = new CategoryServices();
export default categoryServices;
