"use client";

import { Attachment } from "@/types";
import { renderAsync } from "docx-preview";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Image from "next/image";

interface FilePreviewContentProps {
  file: Attachment;
}

export default function FilePreviewContent({ file }: FilePreviewContentProps) {
  const fileUrl = file.fileUrl;
  const fileName = file.fileName?.toLowerCase() || "";
  const extension = fileName.split(".").pop() || "";
  const mimeType = file.mimeType?.toLowerCase() || "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to hold Excel data (Array of Arrays)
  const [excelData, setExcelData] = useState<any[][]>([]);

  const docxRef = useRef<HTMLDivElement>(null);

  // --- 1. ROBUST FILE TYPE DETECTION ---

  const isDocx = useMemo(() => {
    const validExts = ["docx", "doc"];
    const validMimes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    return validExts.includes(extension) || validMimes.includes(mimeType);
  }, [extension, mimeType]);

  const isExcel = useMemo(() => {
    const validExts = ["xlsx", "xls", "csv"];
    const validMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Standard .xlsx
      "application/vnd.ms-excel", // Standard .xls
      "text/csv",
    ];
    // MinIO sometimes returns generic "spreadsheet" or "excel" types
    return (
      validExts.includes(extension) ||
      validMimes.includes(mimeType) ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    );
  }, [extension, mimeType]);

  const isPdf = useMemo(() => {
    return extension === "pdf" || mimeType === "application/pdf";
  }, [extension, mimeType]);

  const isImage = useMemo(() => {
    const validExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    return validExts.includes(extension) || mimeType.startsWith("image/");
  }, [extension, mimeType]);

  useEffect(() => {
    if (!isDocx || !fileUrl) return;

    let isMounted = true;
    const renderDocx = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Fetch failed");
        // Docx Preview requires ArrayBuffer
        const buffer = await res.arrayBuffer();

        if (docxRef.current && isMounted) {
          docxRef.current.innerHTML = "";
          await renderAsync(buffer, docxRef.current, undefined, {
            className: "docx-wrapper",
            inWrapper: true,
            ignoreWidth: false,
          });
        }
      } catch (err) {
        console.error("Docx Error:", err);
        if (isMounted) setError("Unable to preview this document.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    renderDocx();
    return () => {
      isMounted = false;
    };
  }, [fileUrl, isDocx]);

  useEffect(() => {
    if (!isExcel || !fileUrl) return;

    let isMounted = true;
    const renderExcel = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Fetch failed");

        const arrayBuffer = await res.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        if (wb.SheetNames.length === 0) throw new Error("No sheets found");

        const ws = wb.Sheets[wb.SheetNames[0]];

        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (isMounted) setExcelData(data);
      } catch (err) {
        console.error("Excel Error:", err);
        if (isMounted) setError("Unable to read this spreadsheet.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    renderExcel();
    return () => {
      isMounted = false;
    };
  }, [fileUrl, isExcel]);


  if (isLoading && (isDocx || isExcel)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-500">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <a href={fileUrl} download={fileName}>
            <Download className="mr-2 h-4 w-4" /> Download Original
          </a>
        </Button>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4 relative overflow-hidden">
        <Image
          src={fileUrl}
          alt={fileName}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={`${fileUrl}#toolbar=0`}
        className="h-full w-full border-none bg-white"
        title="PDF Preview"
      />
    );
  }

  if (isDocx) {
    return (
      <div className="h-full w-full overflow-auto bg-white">
        <div ref={docxRef} className="p-8 min-h-full" />
      </div>
    );
  }

  if (isExcel) {
    return (
      <div className="h-full w-full overflow-auto bg-white p-4">
        {excelData.length > 0 ? (
          <div className="border rounded-md shadow-sm overflow-hidden inline-block min-w-full">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-zinc-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  {excelData[0]?.map((cell: any, idx: number) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-semibold text-zinc-700 border border-zinc-200 whitespace-nowrap bg-zinc-100"
                    >
                      {cell || ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {excelData.slice(1).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-zinc-50 bg-white transition-colors"
                  >
                    {row.map((cell: any, cIdx: number) => (
                      <td
                        key={cIdx}
                        className="px-4 py-2 border border-zinc-200 whitespace-nowrap text-zinc-600"
                      >
                        {cell !== null && cell !== undefined
                          ? String(cell)
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No data found in this sheet.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="rounded-full bg-zinc-200 p-6 dark:bg-zinc-800">
        <FileText className="h-10 w-10 text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Preview not available
        </p>
        <p className="text-sm text-zinc-500">
          File type <strong>.{extension}</strong> is not supported for preview.
        </p>
      </div>
      <Button asChild variant="outline">
        <a href={fileUrl} download={fileName}>
          <Download className="mr-2 h-4 w-4" /> Download File
        </a>
      </Button>
    </div>
  );
}
