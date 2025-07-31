import { z } from "zod";

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().optional(),
});

export const createBookSchemaValidator = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional(),
  examType: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  location: locationSchema,
});

export const getBookSchemaValidator = z.object({
  id: z.string().length(24, "Invalid book ID"), 
});