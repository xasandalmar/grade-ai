import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
});

export type SchoolInput = z.infer<typeof schoolSchema>;
