import { TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Please describe your issue (min 10 chars)").max(5000),
  priority: z.nativeEnum(TicketPriority).optional().default(TicketPriority.NORMAL),
});

export const postMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

export const listTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigned: z.enum(["me", "unassigned", "any"]).optional(),
  sla: z.enum(["at_risk"]).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const listMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type ApiError = {
  error: string;
  details?: unknown;
};

export function validationError(error: z.ZodError): ApiError {
  return {
    error: "Validation failed",
    details: error.flatten(),
  };
}
