
import { z } from 'zod';

const variantSchema = z.object({
  _id: z.string().optional(),
  size: z.string().trim().min(1, 'Size is required'),
  color: z.string().trim().min(1, 'Colour is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(5),
  sku: z.string().optional(),
});

const variantsSchema = z.array(variantSchema).min(1, 'Add at least one variant').superRefine((variants, context) => {
  const combinations = new Set<string>();
  variants.forEach((variant, index) => {
    const key = `${variant.size.trim().toLocaleLowerCase()}|${variant.color.trim().toLocaleLowerCase()}`;
    if (combinations.has(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'color'],
        message: 'Size and colour combinations must be unique',
      });
    }
    combinations.add(key);
  });
});

const createSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  seller: z.string().trim().min(1, 'Seller is required'),
  category: z.string().trim().min(1, 'Category is required'),
  brand: z.string().optional(),
  price: z.number().min(1, 'Price must be greater than zero'),
  description: z.string().optional(),
  images: z.array(z.string().trim().min(1)).max(12).optional(),
  variants: variantsSchema,
  status: z.enum(['active', 'inactive']).optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  seller: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().min(1).optional(),
  description: z.string().optional(),
  images: z.array(z.string().trim().min(1)).max(12).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  variants: variantsSchema.optional(),
});

const addStockSchema = z.object({
  variantId: z.string().min(1, 'Select a variant'),
  stock: z.number().int().min(1, 'Stock must be greater than zero'),
});

const createNoteSchema = z.object({
  body: z.string().trim().min(1, 'Note cannot be empty').max(2000, 'Note cannot exceed 2000 characters'),
});

const productValidator = {
  createSchema,
  updateSchema,
  addStockSchema,
  createNoteSchema,
};

export default productValidator;
