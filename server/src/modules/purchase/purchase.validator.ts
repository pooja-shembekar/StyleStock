import { z } from 'zod';

const createSchema = z.object({
  product: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
  variantId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product variant ID'),
  quantity: z.number().int().min(1),
  paid: z.number().min(0).optional()
});

const updateSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().positive().optional(),
  paid: z.number().min(0).optional()
}).refine((purchase) => Object.keys(purchase).length > 0, {
  message: 'At least one purchase field must be provided'
});

const purchaseValidator = { createSchema, updateSchema };
export default purchaseValidator;
