import { FolderOpen } from "lucide-react";

export const EmptyFolderState = ({
  onUploadClick,
}: {
  onUploadClick: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
      <FolderOpen className="h-8 w-8 text-zinc-400" />
    </div>
    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
      This folder is empty
    </h3>
    <p className="text-sm text-zinc-500 max-w-xs mt-2 mb-6">
      Upload files or create subfolders to get started with your project
      organization.
    </p>
    <button
      onClick={onUploadClick}
      className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
    >
      Upload a file now
    </button>
  </div>
);
