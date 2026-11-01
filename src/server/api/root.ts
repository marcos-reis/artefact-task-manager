import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { taskRouter } from "@/server/api/routers/task";

/**
 * Primary AppRouter instance combining all application sub-routers.
 */
export const appRouter = createTRPCRouter({
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller factory for SSR in React Server Components.
 */
export const createCaller = createCallerFactory(appRouter);
