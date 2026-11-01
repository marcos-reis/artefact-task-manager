import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * tRPC Context Initialization
 *
 * In Next.js App Router, this context can be expanded with auth sessions,
 * headers, or request-specific telemetry.
 */
export const createTRPCContext = async (opts?: { headers: Headers }) => {
  return {
    headers: opts?.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with SuperJSON transformer and structured Zod error formatting.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
export { TRPCError };
