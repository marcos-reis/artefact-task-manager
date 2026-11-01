"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/trpc/client";

interface TaskFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description?: string;
  };
}

export function TaskForm({ mode, initialData }: TaskFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = trpc.task.create.useMutation({
    onSuccess: async () => {
      toast.success("Task created successfully");
      await utils.task.list.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      const msg = err.data?.zodError?.fieldErrors?.title?.[0] ?? err.message;
      setServerError(msg);
      toast.error("Failed to create task", { description: msg });
    },
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      toast.success("Task updated successfully");
      await utils.task.list.invalidate();
      await utils.task.byId.invalidate({ id: updatedTask.id });
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      const msg = err.data?.zodError?.fieldErrors?.title?.[0] ?? err.message;
      setServerError(msg);
      toast.error("Failed to update task", { description: msg });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setServerError(null);

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setClientError("Title is required.");
      return;
    }

    if (mode === "create") {
      createMutation.mutate({
        title: trimmedTitle,
        description: description.trim() || undefined,
      });
    } else if (mode === "edit" && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        title: trimmedTitle,
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to tasks</span>
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create Task" : "Edit Task"}
        </h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {(clientError || serverError) && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="font-medium">Validation error</p>
              <p className="mt-0.5 text-xs text-red-700">{clientError || serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              disabled={isPending}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (clientError) setClientError(null);
                if (serverError) setServerError(null);
              }}
              placeholder="Task title"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              Description <span className="text-xs text-slate-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              disabled={isPending}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description or notes"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/"
              className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{mode === "create" ? "Create Task" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
