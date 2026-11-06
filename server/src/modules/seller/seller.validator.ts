import { z } from 'zod';

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  contactNo: z.string().trim().min(1)
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  contactNo: z.string().trim().min(1).optional()
}).refine((seller) => Object.keys(seller).length > 0, {
  message: 'At least one seller field must be provided'
});

const sellerValidator = { createSchema, updateSchema };
export default sellerValidator;
