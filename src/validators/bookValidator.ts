import { z } from "zod";

const locationSchema = z.object({
    coordinates: z
        .array(z.number())
        .length(2, { message: "Coordinates must be an array of two numbers [lng, lat]" }),
    placeName: z.string(),
});

export const createBookSchemaValidator = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    description: z.string().optional(),
    examType: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number"),
    location: locationSchema.optional(),
});



export const getBookSchemaValidator = z.object({
    id: z.string().length(24, "Invalid book ID"),
});


