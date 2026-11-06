import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6, { message: 'password must have 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'password must have 6 characters' })
});

const updatedProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Avatar URL must use HTTPS'
  }).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional()
}).refine((profile) => Object.keys(profile).length > 0, {
  message: 'At least one profile field must be provided'
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, { message: 'password must have 6 characters' })
});

const changePasswordSchema = z.object({
  oldPassword: z
    .string({ required_error: 'Old Password is required!' })
    .min(6, { message: 'old password must have 6 characters' }),
  newPassword: z
    .string({ required_error: 'New Password is required!' })
    .min(6, { message: 'new password must have 6 characters' })
});

const userValidator = { registerSchema, loginSchema, updatedProfileSchema, changePasswordSchema };
export default userValidator;
