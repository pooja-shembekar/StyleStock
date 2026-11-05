import { z } from 'zod';

const createSchema = z.object({
  product: z.string(),
  variantId: z.string().min(1, 'Select a variant'),
  productName: z.string().trim().min(1),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
  productPrice: z.number().min(1, { message: 'Must be equal or grater than 1' }),
  buyerName: z.string().trim().min(1),
  date: z.string().min(1)
});

const updateSchema = z.object({
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }).optional(),
  price: z.number().positive().optional(),
  buyerName: z.string().optional(),
  date: z.string().optional()
});

const saleValidator = { createSchema, updateSchema };
export default saleValidator;
