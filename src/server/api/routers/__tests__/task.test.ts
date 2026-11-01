import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { taskStore } from "@/server/db/task-store";

describe("tRPC Task Router Integration Tests", () => {
  const createCaller = () => {
    const ctx = { headers: new Headers() };
    return appRouter.createCaller(ctx);
  };

  beforeEach(() => {
    taskStore.reset();
  });

  describe("task.list", () => {
    it("should return the default paginated batch of tasks with nextCursor", async () => {
      const caller = createCaller();
      const result = await caller.task.list({ limit: 5 });

      expect(result.items).toHaveLength(5);
      expect(result.nextCursor).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(10);

      // Verify descending order by createdAt
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result.items[i + 1].createdAt.getTime()
        );
      }
    });

    it("should paginate correctly using cursor", async () => {
      const caller = createCaller();
      const firstPage = await caller.task.list({ limit: 4 });
      expect(firstPage.items).toHaveLength(4);
      expect(firstPage.nextCursor).toBeDefined();

      const secondPage = await caller.task.list({
        limit: 4,
        cursor: firstPage.nextCursor,
      });

      expect(secondPage.items).toHaveLength(4);
      // Ensure no overlapping items between page 1 and page 2
      const firstIds = new Set(firstPage.items.map((t) => t.id));
      for (const item of secondPage.items) {
        expect(firstIds.has(item.id)).toBe(false);
      }
    });
  });

  describe("task.byId", () => {
    it("should return an existing task by ID", async () => {
      const caller = createCaller();
      const list = await caller.task.list({ limit: 1 });
      const targetId = list.items[0].id;

      const task = await caller.task.byId({ id: targetId });
      expect(task).toBeDefined();
      expect(task.id).toBe(targetId);
      expect(task.title).toBeTruthy();
    });

    it("should throw NOT_FOUND TRPCError for non-existent ID", async () => {
      const caller = createCaller();
      await expect(
        caller.task.byId({ id: "non-existent-id-404" })
      ).rejects.toThrowError(/not found/i);
    });
  });

  describe("task.create", () => {
    it("should create a new task successfully with timestamp and UUID", async () => {
      const caller = createCaller();
      const newTask = await caller.task.create({
        title: "Test Task Creation",
        description: "Integration test description",
      });

      expect(newTask.id).toBeDefined();
      expect(newTask.title).toBe("Test Task Creation");
      expect(newTask.description).toBe("Integration test description");
      expect(newTask.createdAt).toBeInstanceOf(Date);

      // Verify it appears in listing
      const fetched = await caller.task.byId({ id: newTask.id });
      expect(fetched.title).toBe("Test Task Creation");
    });

    it("should reject creation if title is empty or whitespace only", async () => {
      const caller = createCaller();
      await expect(
        caller.task.create({
          title: "   ",
        })
      ).rejects.toThrow();
    });
  });

  describe("task.update", () => {
    it("should update an existing task", async () => {
      const caller = createCaller();
      const created = await caller.task.create({
        title: "Original Title",
        description: "Original Description",
      });

      const updated = await caller.task.update({
        id: created.id,
        title: "Updated Title",
        description: "Updated Description",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated Description");
    });

    it("should throw NOT_FOUND TRPCError when updating non-existent task", async () => {
      const caller = createCaller();
      await expect(
        caller.task.update({
          id: "invalid-task-id-999",
          title: "Should Fail",
        })
      ).rejects.toThrowError(/does not exist/i);
    });
  });

  describe("task.delete", () => {
    it("should delete an existing task", async () => {
      const caller = createCaller();
      const created = await caller.task.create({
        title: "Task to be Deleted",
      });

      const result = await caller.task.delete({ id: created.id });
      expect(result.success).toBe(true);
      expect(result.id).toBe(created.id);

      // Verify it is gone
      await expect(caller.task.byId({ id: created.id })).rejects.toThrowError(
        /not found/i
      );
    });

    it("should throw NOT_FOUND TRPCError when deleting non-existent task", async () => {
      const caller = createCaller();
      await expect(
        caller.task.delete({ id: "invalid-task-id-999" })
      ).rejects.toThrowError(/does not exist/i);
    });
  });
});
