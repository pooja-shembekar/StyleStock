/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Types, UpdateQuery } from 'mongoose';
import CustomError from '../errors/customError';
import httpStatus from 'http-status';

class BaseServices<T extends { user: Types.ObjectId }> {
  protected model: Model<T>;
  protected modelName: string = '';

  constructor(model: Model<T>, modelName: string) {
    if (!model || !(model.prototype instanceof Model)) {
      throw new Error('Invalid Mongoose model!');
    }

    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Create new
   */
  async create(payload: Partial<T>, userId: string) {
    return this.model.create({ ...payload, user: new Types.ObjectId(userId) });
  }

  /**
   * Update
   */
  async update(id: string, payload: UpdateQuery<T>, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new CustomError(httpStatus.BAD_REQUEST, `Invalid ${this.modelName} ID`);
    }

    const updated = await this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
      payload,
      { new: true, runValidators: true }
    );
    if (!updated) throw new CustomError(httpStatus.NOT_FOUND, `${this.modelName} is not found!`);
    return updated;
  }

  /**
   * Delete
   */
  async delete(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new CustomError(httpStatus.BAD_REQUEST, `Invalid ${this.modelName} ID`);
    }

    const deleted = await this.model.findOneAndDelete({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId)
    });
    if (!deleted) throw new CustomError(httpStatus.NOT_FOUND, `${this.modelName} is not found!`);
    return deleted;
  }

  protected async _isExists(id: string) {
    if (!(await this.model.findById(id))) {
      throw new CustomError(httpStatus.NOT_FOUND, this.modelName + ' is not found!');
    }
  }
}

export default BaseServices;
