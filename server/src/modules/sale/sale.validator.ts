import { z } from 'zod';

const saleDateSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
  }, 'Invalid sale date')
]);

const createSchema = z.object({
  product: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
  variantId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product variant ID'),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
  buyerName: z.string().trim().min(1),
  date: saleDateSchema
});

const updateSchema = z.object({
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }).optional(),
  price: z.number().positive().optional(),
  buyerName: z.string().trim().min(1).optional(),
  date: saleDateSchema.optional()
}).refine((sale) => Object.keys(sale).length > 0, {
  message: 'At least one sale field must be provided'
});

const saleValidator = { createSchema, updateSchema };
export default saleValidator;
