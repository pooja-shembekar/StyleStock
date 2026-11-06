import httpStatus from 'http-status';
import CustomError from '../../errors/customError';
import generateToken from '../../utils/generateToken';
import { IUser } from './user.interface';
import User from './user.model';
import verifyPassword from '../../utils/verifyPassword';
import bcrypt from 'bcrypt';
import { toPublicUser } from './user.dto';

interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

class UserServices {
  private model = User;

  // get profile
  async getSelf(userId: string) {
    return this.model.findById(userId);
  }
  // register new user
  async register(payload: IRegisterPayload) {
    if (payload.password !== payload.confirmPassword) {
      throw new CustomError(httpStatus.BAD_REQUEST, 'Passwords do not match');
    }

    const user = await this.model.create({
      name: payload.name,
      email: payload.email,
      password: payload.password
    });

    const token = generateToken({ _id: user._id, email: user.email });
    return { token, user: toPublicUser(user) };
  }

  // login existing user
  async login(payload: { email: string; password: string }) {
    const user = await this.model.findOne({ email: payload.email }).select('+password');

    if (user) {
      await verifyPassword(payload.password, user.password);

      const token = generateToken({ _id: user._id, email: user.email });
      return { token, user: toPublicUser(user) };
    } else {
      throw new CustomError(httpStatus.BAD_REQUEST, 'WrongCredentials');
    }
  }

  // update user profile
  async updateProfile(id: string, payload: Partial<IUser>) {
    return this.model.findByIdAndUpdate(id, payload);
  }

  // change Password
  async changePassword(userId: string, payload: { oldPassword: string; newPassword: string }) {
    const user = await this.model.findById(userId).select('+password');
    if (!user) throw new CustomError(httpStatus.NOT_FOUND, 'User not found');

    const matchedPassword = await bcrypt.compare(payload.oldPassword, user.password);

    if (!matchedPassword) {
      throw new CustomError(400, 'Old Password does not matched!');
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
    const updatedUser = await this.model.findByIdAndUpdate(userId, { password: hashedPassword });

    return updatedUser;
  }
}

const userServices = new UserServices();
export default userServices;
