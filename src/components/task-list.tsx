"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Calendar, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/trpc/client";

export function TaskList() {
  const utils = trpc.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.task.list.useInfiniteQuery(
    { limit: 8 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = trpc.task.delete.useMutation({
    onMutate: ({ id }) => {
      setDeletingId(id);
    },
    onSuccess: async () => {
      toast.success("Task deleted successfully");
      await utils.task.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to delete task", {
        description: err.message,
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const tasks = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A list of all tasks currently registered in the system.
          </p>
        </div>

        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="my-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          <p className="mt-2 text-sm text-slate-500">Loading tasks...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="my-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium">Error loading tasks: {error.message}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-3 text-xs font-semibold text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tasks.length === 0 && (
        <div className="my-16 rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <h3 className="text-sm font-medium text-slate-900">No tasks yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating your first task.
          </p>
          <div className="mt-4">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </Link>
          </div>
        </div>
      )}

      {/* Task List */}
      {!isLoading && tasks.length > 0 && (
        <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
          {tasks.map((task) => {
            const isDeleting = deletingId === task.id;
            const formattedDate = new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(task.createdAt));

            return (
              <div
                key={task.id}
                className="flex flex-col justify-between p-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex-1 pr-4">
                  <h2 className="text-base font-medium text-slate-900">
                    {task.title}
                  </h2>

                  {task.description && (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created on {formattedDate}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:shrink-0">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => deleteMutation.mutate({ id: task.id })}
                    aria-label={`Delete task: ${task.title}`}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={loadMoreRef} className="py-6 text-center text-xs text-slate-400">
        {isFetchingNextPage && (
          <div className="inline-flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            <span>Loading more tasks...</span>
          </div>
        )}
        {!hasNextPage && tasks.length > 0 && (
          <span>End of list ({tasks.length} tasks)</span>
        )}
      </div>
    </div>
  );
}
