import {  z } from "zod";

export const registerValidator = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^[0-9]{10}$/, "Invalid Indian phone number"),
  photo:z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
})


export const loginValidator = z.object({
     email: z.string().email(),
  password: z.string().min(6),
})

export const forgetPasswordValidator = z.object({
    email:z.string()
})