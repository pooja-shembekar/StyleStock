import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import CustomError from '../errors/customError';
import httpStatus from 'http-status';
import config from '../config';
import { Types } from 'mongoose';

const verifyAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match || !config.jwt_secret) {
    throw new CustomError(httpStatus.UNAUTHORIZED, 'Unauthorize! please login', 'Unauthorize');
  }

  try {
    const decode = jwt.verify(match[1], config.jwt_secret) as JwtPayload;
    if (
      typeof decode._id !== 'string' ||
      !Types.ObjectId.isValid(decode._id) ||
      typeof decode.email !== 'string'
    ) {
      throw new Error('Invalid token claims');
    }

    req.user = { _id: decode._id, email: decode.email };
    next();
  } catch {
    throw new CustomError(httpStatus.UNAUTHORIZED, 'Unauthorize! please login', 'Unauthorize');
  }
};

export default verifyAuth;
