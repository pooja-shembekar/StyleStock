import config from '../config';
import jwt, { JwtPayload } from 'jsonwebtoken';

const generateToken = (payload: JwtPayload) => {
  if (!config.jwt_secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, config.jwt_secret, { expiresIn: '2d' });
};

export default generateToken;
