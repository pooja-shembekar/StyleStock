import { z } from 'zod';

const createSchema = z.object({
  name: z.string().trim().min(1)
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional()
}).refine((brand) => Object.keys(brand).length > 0, {
  message: 'At least one brand field must be provided'
});

const brandValidator = { createSchema, updateSchema };
export default brandValidator;
