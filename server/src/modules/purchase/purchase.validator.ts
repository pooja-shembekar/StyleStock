import { z } from 'zod';

const createSchema = z.object({
  product: z.string(),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  seller: z.string().optional(),
  sellerName: z.string().optional(),
  productName: z.string().optional(),
  unitPrice: z.number().positive().optional(),
  paid: z.number().optional()
});

const updateSchema = z.object({
  seller: z.string().optional(),
  product: z.string().optional(),
  sellerName: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().positive().optional(),
  paid: z.number().min(0).optional()
});

const purchaseValidator = { createSchema, updateSchema };
export default purchaseValidator;
