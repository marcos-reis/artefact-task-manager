/**
 * Task Domain Model & In-Memory Storage Engine
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface TaskListOptions {
  limit?: number;
  cursor?: string | null;
}

export interface TaskListResult {
  items: Task[];
  nextCursor?: string;
  totalCount: number;
}

/** Initial realistic seed data for the application */
const INITIAL_SEED_TASKS: Omit<Task, "id" | "createdAt">[] = [
  {
    title: "Review quarterly infrastructure budget and cloud expenses",
    description: "Analyze AWS and Cloudflare monthly invoices to identify idle compute resources and optimize database instance sizing.",
  },
  {
    title: "Update API authentication documentation",
    description: "Document OAuth2 token refresh flow and provide curl examples for the mobile development team.",
  },
  {
    title: "Investigate database connection pool exhaustion on staging",
    description: "Check connection leak during batch report export and configure PgBouncer max client limits.",
  },
  {
    title: "Refactor user notification preferences service",
    description: "Extract email and SMS delivery logic into dedicated queue workers to improve HTTP response latency.",
  },
  {
    title: "Prepare rollback plan for upcoming database migration",
    description: "Write down-migration SQL script and test index recreation on a sanitized staging snapshot.",
  },
  {
    title: "Audit web application accessibility and keyboard navigation",
    description: "Verify ARIA labels on modal dialogs, ensure logical tab order, and test with screen readers.",
  },
  {
    title: "Set up automated alerting for payment webhook failures",
    description: "Configure Datadog monitor to trigger a PagerDuty alert if webhook 5xx error rate exceeds 2% over 5 minutes.",
  },
  {
    title: "Optimize image assets and cache headers on marketing site",
    description: "Convert PNG banners to WebP format and configure stale-while-revalidate headers on CDN edge.",
  },
  {
    title: "Renew SSL certificates for internal staging endpoints",
    description: "Check certbot auto-renewal timer on nginx reverse proxy and verify renewal hooks.",
  },
  {
    title: "Conduct security review of third-party npm dependencies",
    description: "Run npm audit and update packages with reported high-severity vulnerabilities.",
  },
  {
    title: "Configure health check endpoints for container orchestrator",
    description: "Implement /healthz and /readyz endpoints with deep checks for database and Redis connectivity.",
  },
  {
    title: "Draft release notes for version 2.4.0 deployment",
    description: "Summarize bug fixes, performance improvements, and breaking API changes for customer support team.",
  },
];

export class InMemoryTaskStore {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.tasks.clear();
    const now = Date.now();

    INITIAL_SEED_TASKS.forEach((seed, index) => {
      const id = `task-${(index + 1).toString().padStart(2, "0")}`;
      const createdAt = new Date(now - index * 1000 * 60 * 30); // 30 mins apart

      this.tasks.set(id, {
        id,
        title: seed.title,
        description: seed.description,
        createdAt,
      });
    });
  }

  public reset(): void {
    this.seed();
  }

  public list(options: TaskListOptions = {}): TaskListResult {
    const limit = options.limit ?? 8;
    const allTasks = Array.from(this.tasks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = allTasks.findIndex((t) => t.id === options.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = allTasks.slice(startIndex, startIndex + limit);
    const hasNextPage = startIndex + limit < allTasks.length;
    const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1].id : undefined;

    return {
      items,
      nextCursor,
      totalCount: allTasks.length,
    };
  }

  public getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public create(data: { title: string; description?: string }): Task {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const task: Task = {
      id,
      title: data.title.trim(),
      description: data.description?.trim() ? data.description.trim() : undefined,
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    return task;
  }

  public update(id: string, data: { title: string; description?: string }): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Task = {
      ...existing,
      title: data.title.trim(),
      description: data.description?.trim() ? data.description.trim() : undefined,
    };

    this.tasks.set(id, updated);
    return updated;
  }

  public delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}

const globalForTaskStore = globalThis as unknown as {
  taskStore?: InMemoryTaskStore;
};

export const taskStore = globalForTaskStore.taskStore ?? new InMemoryTaskStore();

if (process.env.NODE_ENV !== "production") {
  globalForTaskStore.taskStore = taskStore;
}
