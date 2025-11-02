import React from "react";
import { FileStatus } from "../types/type";
interface FileStatusDotProps {
  status: FileStatus;
  className?: string;
}

const getDotColorClass = (status: FileStatus): string => {
  switch (status) {
    case FileStatus.PROCESSING:
    case FileStatus.UPDATING:
    case FileStatus.PENDING:
    case FileStatus.UPLOADING:
      return "dot-blue";
    case FileStatus.UPLOADED:
      return "dot-yellow";
    case FileStatus.COMPLETED:
      return "dot-green";
    case FileStatus.FAILED:
      return "dot-red";
    default:
      return "dot-slate";
  }
};

const FileStatusDot: React.FC<FileStatusDotProps> = ({ status, className }) => {
  const colorClass = getDotColorClass(status);
  const shouldAnimate = [
    FileStatus.PROCESSING,
    FileStatus.UPDATING,
    FileStatus.PENDING,
    FileStatus.UPLOADING,
    FileStatus.UPLOADED,
  ].includes(status);

  return (
    <div
      className={`status-dot ${colorClass} ${
        shouldAnimate ? "animate-pulse-light" : ""
      } ${className || ""}`}
    />
  );
};

export default FileStatusDot;
