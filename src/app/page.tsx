import { HydrateClient, trpc } from "@/trpc/server";
import { TaskList } from "@/components/task-list";

/**
 * Configure dynamic SSR rendering so every request executes fresh on the server.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // SSR Prefetch the first batch of tasks on the server
  void trpc.task.list.prefetchInfinite({ limit: 8 });

  return (
    <HydrateClient>
      <TaskList />
    </HydrateClient>
  );
}
