import { z } from 'zod';

const createSchema = z.object({
  name: z.string().trim().min(1)
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional()
});

const brandValidator = { createSchema, updateSchema };
export default brandValidator;
