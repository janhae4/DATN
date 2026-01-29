"use client";

import { renderAsync } from "docx-preview";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Image from "next/image";

interface FilePreviewProps {
  url: string;
}

export default function FilePreview({ url }: FilePreviewProps) {
  const cleanUrl = url.split("?")[0];
  const fileName = cleanUrl.split("/").pop() || "document";
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docxRef = useRef<HTMLDivElement>(null);
  const excelRef = useRef<HTMLDivElement>(null);

  const isDocx = ["docx", "doc"].includes(extension);
  const isExcel = ["xlsx", "xls", "csv"].includes(extension);
  const isPdf = ["pdf"].includes(extension);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
    extension,
  );

  console.log(
    "IS DOCX",
    isDocx,
    "IS EXCEL",
    isExcel,
    "IS PDF",
    isPdf,
    "IS IMAGE",
    isImage,
  );
  useEffect(() => {
    if (!isDocx || !url) return;

    let isMounted = true;
    const renderDocx = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch file");

        const buffer = await response.arrayBuffer();

        if (docxRef.current && isMounted) {
          docxRef.current.innerHTML = "";

          await renderAsync(buffer, docxRef.current, undefined, {
            className: "docx-wrapper",
            inWrapper: true,
            ignoreWidth: false,
            experimental: true, 
          });
        }
      } catch (err: any) {
        console.error("Docx Preview Error:", err);
        if (isMounted) {
          setError(
            err.message?.includes("childNodes")
              ? "File DOCX này có cấu trúc phức tạp không thể hiển thị."
              : "Không thể hiển thị tài liệu này.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    renderDocx();
    return () => {
      isMounted = false;
    };
  }, [url, isDocx]);

  useEffect(() => {
    console.log("RENDER EXCEL");
    if (!isExcel || !url) return;

    let isMounted = true;
    const renderExcel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch file");

        const arrayBuffer = await response.arrayBuffer();

        // Parse Workbook
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        const html = XLSX.utils.sheet_to_html(ws);

        if (excelRef.current && isMounted) {
          excelRef.current.innerHTML = `
                        <style>
                            table { border-collapse: collapse; width: 100%; font-size: 13px; font-family: sans-serif; }
                            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; white-space: nowrap; }
                            th { background-color: #f8fafc; font-weight: 600; color: #334155; }
                            tr:nth-child(even) { background-color: #fcfcfc; }
                            tr:hover { background-color: #f1f5f9; }
                        </style>
                        ${html}
                    `;
        }
      } catch (err) {
        console.error("Excel Preview Error:", err);
        if (isMounted) setError("Không thể đọc file Excel này.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    renderExcel();
    return () => {
      isMounted = false;
    };
  }, [url, isExcel]);

  // --- RENDER UI ---

  // A. Loading State (Chỉ hiện cho Docx/Excel vì Image/Iframe tự load)
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      <span className="text-xs text-zinc-500 font-medium">
        Đang tải nội dung...
      </span>
    </div>
  );

  // B. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <Button variant="outline" size="sm" asChild className="mt-2">
          <a href={url} download>
            <Download className="mr-2 h-4 w-4" /> Tải xuống file gốc
          </a>
        </Button>
      </div>
    );
  }

  // C. IMAGE
  if (isImage) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4 overflow-hidden">
        <Image
          src={url}
          alt={fileName}
          fill
          className="object-contain"
          unoptimized // Quan trọng nếu load từ MinIO/S3 ngoài domain config
        />
      </div>
    );
  }

  // D. PDF
  if (isPdf) {
    return (
      <iframe
        src={`${url}#toolbar=0&view=FitH`}
        className="w-full h-full border-none bg-white"
        title={fileName}
      />
    );
  }

  // E. DOCX Container
  if (isDocx) {
    return (
      <div className="relative w-full h-full bg-white overflow-auto">
        {isLoading && <LoadingSpinner />}
        <div ref={docxRef} className="p-8 min-h-full" />
      </div>
    );
  }

  // F. EXCEL Container
  if (isExcel) {
    return (
      <div className="relative w-full h-full bg-white overflow-auto">
        {isLoading && <LoadingSpinner />}
        <div ref={excelRef} className="p-4 min-h-full" />
      </div>
    );
  }

  // G. FALLBACK (Các file không hỗ trợ)
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="h-20 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
        <FileText className="h-10 w-10 text-zinc-400" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Không thể xem trước
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Định dạng <strong>.{extension}</strong> chưa được hỗ trợ hiển thị trực
          tiếp.
        </p>
      </div>
      <Button asChild variant="default">
        <a href={url} download>
          <Download className="mr-2 h-4 w-4" />
          Tải xuống để xem
        </a>
      </Button>
    </div>
  );
}
