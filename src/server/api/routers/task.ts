import { z } from "zod";
import { createTRPCRouter, publicProcedure, TRPCError } from "@/server/api/trpc";
import { taskStore } from "@/server/db/task-store";

/**
 * Task Management Router
 *
 * Implements full CRUD operations, cursor-based pagination for infinite scroll,
 * and semantic error responses (TRPCError) for missing records or invalid inputs.
 */
export const taskRouter = createTRPCRouter({
  /**
   * List tasks with optional cursor-based pagination and limit.
   * If called without arguments, returns default paginated batch.
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).optional().default(8),
          cursor: z.string().nullish(),
        })
        .optional()
    )
    .query(({ input }) => {
      const limit = input?.limit ?? 8;
      const cursor = input?.cursor ?? undefined;
      return taskStore.list({ limit, cursor });
    }),

  /**
   * Retrieve a single task by ID.
   * Throws 404 NOT_FOUND if the record does not exist.
   */
  byId: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Task ID is required."),
      })
    )
    .query(({ input }) => {
      const task = taskStore.getById(input.id);
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task with ID "${input.id}" was not found.`,
        });
      }
      return task;
    }),

  /**
   * Create a new task.
   * Enforces non-empty title and optional description.
   */
  create: publicProcedure
    .input(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Task title is required and cannot be empty.")
          .max(120, "Task title must not exceed 120 characters."),
        description: z
          .string()
          .trim()
          .max(1000, "Description must not exceed 1000 characters.")
          .optional(),
      })
    )
    .mutation(({ input }) => {
      return taskStore.create({
        title: input.title,
        description: input.description,
      });
    }),

  /**
   * Update an existing task.
   * Throws 404 NOT_FOUND if attempting to update a non-existent task ID.
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Task ID is required."),
        title: z
          .string()
          .trim()
          .min(1, "Task title is required and cannot be empty.")
          .max(120, "Task title must not exceed 120 characters."),
        description: z
          .string()
          .trim()
          .max(1000, "Description must not exceed 1000 characters.")
          .optional(),
      })
    )
    .mutation(({ input }) => {
      const updated = taskStore.update(input.id, {
        title: input.title,
        description: input.description,
      });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Cannot update task: Task with ID "${input.id}" does not exist.`,
        });
      }

      return updated;
    }),

  /**
   * Delete an existing task.
   * Throws 404 NOT_FOUND if attempting to delete a non-existent task ID.
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Task ID is required."),
      })
    )
    .mutation(({ input }) => {
      const deleted = taskStore.delete(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Cannot delete task: Task with ID "${input.id}" does not exist.`,
        });
      }

      return { success: true, id: input.id };
    }),
});
