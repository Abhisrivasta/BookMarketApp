import { email, z } from "zod";

export const registerValidator = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Confirm Password must be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});


export const loginValidator = z.object({
     email: z.string().email(),
  password: z.string().min(6),
})

export const forgetPasswordValidator = z.object({
    email:z.string()
})