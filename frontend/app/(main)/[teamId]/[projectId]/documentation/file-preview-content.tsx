"use client"

import { Attachment } from "@/types";
import { renderAsync } from "docx-preview";
import { FileText, Download, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Image from "next/image";

interface FilePreviewContentProps {
  file: Attachment;
}

export default function FilePreviewContent({ file }: FilePreviewContentProps) {
  const fileUrl = file.fileUrl;
  const fileName = file.fileName?.toLowerCase() || "";
  const fileType = file.fileType?.toLowerCase() || "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docxRef = useRef<HTMLDivElement>(null);
  const excelRef = useRef<HTMLDivElement>(null);

  // Logic xác định loại file
  const isDocx = fileName.endsWith(".docx") || (fileType.includes("document") && !fileType.includes("text"));
  const isExcel = fileName.match(/\.(xlsx|xls|csv)$/) || fileType.includes("spreadsheet") || fileType.includes("excel");
  const isPdf = fileName.endsWith(".pdf") || fileType === "application/pdf";
  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || fileType.startsWith("image/");

  // --- 1. XỬ LÝ DOCX ---
  useEffect(() => {
    if (!isDocx || !fileUrl) return;

    const renderDocx = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        if (docxRef.current) {
          docxRef.current.innerHTML = ""; // Clear cũ
          await renderAsync(blob, docxRef.current);
        }
      } catch (err) {
        console.error("Docx Error:", err);
        setError("Không thể hiển thị bản xem trước tài liệu này.");
      } finally {
        setIsLoading(false);
      }
    };
    renderDocx();
  }, [fileUrl, isDocx]);

  // --- 2. XỬ LÝ EXCEL ---
  useEffect(() => {
    if (!isExcel || !fileUrl) return;

    const renderExcel = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]]; // Lấy sheet đầu tiên
        const html = XLSX.utils.sheet_to_html(ws);

        if (excelRef.current) {
          excelRef.current.innerHTML = `
            <style>
              table { border-collapse: collapse; width: 100%; font-size: 13px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; white-space: nowrap; }
              th { background-color: #f8fafc; font-weight: 600; }
              tr:nth-child(even) { background-color: #fcfcfc; }
            </style>
            ${html}
          `;
        }
      } catch (err) {
        console.error("Excel Error:", err);
        setError("Không thể đọc file Excel này.");
      } finally {
        setIsLoading(false);
      }
    };
    renderExcel();
  }, [fileUrl, isExcel]);

  // --- RENDER ---

  // 1. Ảnh
  if (isImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4">
        <Image
          src={fileUrl}
          alt={fileName}
          width={0} height={0} sizes="100vw"
          className="h-auto w-auto max-h-full max-w-full object-contain shadow-sm"
        />
      </div>
    );
  }

  // 2. PDF
  if (isPdf) {
    return (
      <iframe
        src={`${fileUrl}#toolbar=0`}
        className="h-full w-full border-none bg-white"
        title="PDF Preview"
      />
    );
  }

  // 3. DOCX
  if (isDocx) {
    return (
      <div className="h-full w-full overflow-auto bg-white p-8">
        {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-400"/></div>}
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        <div ref={docxRef} />
      </div>
    );
  }

  // 4. EXCEL
  if (isExcel) {
    return (
      <div className="h-full w-full overflow-auto bg-white p-4">
        {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-400"/></div>}
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        <div ref={excelRef} />
      </div>
    );
  }

  // 5. Fallback (Không hỗ trợ preview)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="rounded-full bg-zinc-200 p-6 dark:bg-zinc-800">
        <FileText className="h-10 w-10 text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">Không hỗ trợ xem trước</p>
        <p className="text-sm text-zinc-500">Định dạng {fileName.split('.').pop()} cần được tải xuống.</p>
      </div>
      <Button asChild variant="outline">
        <a href={fileUrl} download={fileName}>
          <Download className="mr-2 h-4 w-4" /> Tải xuống ngay
        </a>
      </Button>
    </div>
  );
}