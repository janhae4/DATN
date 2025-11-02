"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  file: string | File;
  setIsPdfLoading: (isLoading: boolean) => void;
}

export default function PdfViewer({ file, setIsPdfLoading }: PdfViewerProps) {
  console.log(file);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - 32);
    }
  }, [containerRef]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    console.log("Tải PDF thành công, số trang:", numPages);
    setIsPdfLoading(false);
  }

  function onDocumentLoadError(error: any) {
    console.error("Lỗi khi tải PDF:", error.message);
    setIsPdfLoading(false);
  }

  function onPageRenderSuccess() {
    console.log("Render trang PDF thành công");
    setIsPdfLoading(false);
  }


  const options = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  const goToPrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages!));
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        options={options}
      >
        <Page
          key={`page_${pageNumber}`}
          pageNumber={pageNumber}
          width={containerWidth}
          onRenderSuccess={onPageRenderSuccess}
          renderAnnotationLayer={true}
          renderTextLayer={true}
        />
      </Document>

      {numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-2 mb-2 p-2 rounded bg-slate-100 sticky bottom-0 z-10 shadow-md">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 rounded bg-slate-300 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <p className="text-sm text-slate-700 font-medium">
            Page {pageNumber} / {numPages}
          </p>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 rounded bg-slate-300 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
