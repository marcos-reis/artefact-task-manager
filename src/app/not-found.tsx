import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Task Not Found
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        The task you are looking for does not exist or may have been deleted.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Task List</span>
        </Link>
      </div>
    </div>
  );
}
