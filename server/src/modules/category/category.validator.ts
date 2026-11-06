import { z } from 'zod';

const createSchema = z.object({
  name: z.string().trim().min(1)
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional()
}).refine((category) => Object.keys(category).length > 0, {
  message: 'At least one category field must be provided'
});

const categoryValidator = { createSchema, updateSchema };
export default categoryValidator;
