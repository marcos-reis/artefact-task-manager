import { notFound } from "next/navigation";
import { trpc } from "@/trpc/server";
import { TaskForm } from "@/components/task-form";

export const dynamic = "force-dynamic";

interface EditTaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: EditTaskPageProps) {
  const { id } = await params;
  return {
    title: `Edit Task ${id} — TaskCraft`,
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;

  try {
    const task = await trpc.task.byId({ id });

    return (
      <TaskForm
        mode="edit"
        initialData={{
          id: task.id,
          title: task.title,
          description: task.description,
        }}
      />
    );
  } catch (error) {
    notFound();
  }
}
