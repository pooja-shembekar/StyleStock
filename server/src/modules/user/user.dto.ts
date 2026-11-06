import { HydratedDocument } from 'mongoose';
import { IUser } from './user.interface';

export const toPublicUser = (user: HydratedDocument<IUser>) => {
  const { password: passwordHash, ...publicUser } = user.toObject();
  void passwordHash;
  return publicUser;
};
