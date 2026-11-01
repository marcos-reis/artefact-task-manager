import { TaskForm } from "@/components/task-form";

export const metadata = {
  title: "New Task — TaskCraft",
  description: "Create a new task in the management queue.",
};

export default function NewTaskPage() {
  return <TaskForm mode="create" />;
}
