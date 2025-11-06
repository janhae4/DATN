import { Attachment } from "@/types/attachment.interface";
import { renderAsync } from "docx-preview";
import { FileText, Download } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"


const getFriendlyExtension = (fileType: string, fileName: string): string => {

    if (fileName.endsWith(".docx")) return ".docx";
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) return ".xlsx";
    if (fileName.endsWith(".pptx")) return ".pptx";
    if (fileName.endsWith(".zip")) return ".zip";
    if (fileName.endsWith(".rar")) return ".rar";
    if (fileName.endsWith(".txt")) return ".txt";
    if (fileName.endsWith(".pdf")) return ".pdf";

    if (!fileType) return "";
    const type = fileType.toLowerCase();
    
    if (type.includes("word") || type.includes("document")) return ".docx";
    if (type.includes("excel") || type.includes("spreadsheet")) return ".xlsx";
    if (type.includes("powerpoint") || type.includes("presentation")) return ".pptx";
    if (type.startsWith("text/plain")) return ".txt";

    // Fallback: Lấy đuôi từ MIME type nếu nó ngắn
    const extension = type.split('/').pop();
    if (extension && extension.length < 10 && !extension.includes('*')) return `.${extension}`; 

    return ""; // Bỏ qua nếu quá dài
}

export default function FilePreview({ file }: { file: Attachment }) {
    const fileType = file.fileType || "";
    const fileUrl = file.fileUrl;
    const fileName = file.fileName || ""; // <-- LẤY TÊN FILE
    
    // 1. Ref cho DOCX và EXCEL
    const docxRef = useRef<HTMLDivElement>(null);
    const excelRef = useRef<HTMLDivElement>(null);

    const isDocx = (fileType.includes("word") || fileType.includes("document")) || fileName.endsWith('.docx');
    const isExcel = (fileType.includes("excel") || fileType.includes("spreadsheet")) || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPdf = (fileType === "application/pdf") || fileName.endsWith('.pdf');
    const isImage = fileType.startsWith("image/") || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.gif') || fileName.endsWith('.webp');

    // 2. Xử lý Ảnh (Sửa check)
    if (isImage) {
        return (
            <img 
                src={fileUrl} 
                alt={`Preview of ${file.fileName}`} 
                className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
        )
    }

    // 3. Xử lý PDF (Sửa check)
    if (isPdf) {
        return (
            <iframe 
                src={fileUrl} 
                className="w-full h-[70vh] border-0"
                title={`Preview of ${file.fileName}`}
            >
                Your browser does not support PDF previews.
            </iframe>
        )
    }

    // 4. --- LOGIC MỚI CHO DOCX ---
    useEffect(() => {
        // Chỉ chạy nếu nó là .docx và cái div đã sẵn sàng
        if (isDocx && docxRef.current) {
            const container = docxRef.current;
            
            // Xóa preview cũ (nếu có)
            container.innerHTML = "<p>Loading docx preview...</p>";
            
            // File URL của mày là local (blob:...), nên phải fetch nó
            fetch(fileUrl)
                .then(response => response.blob())
                .then(blob => {
                    // Dùng docx-preview để "vẽ" file blob vào cái div
                    renderAsync(blob, container)
                        .then(() => {
                            console.log("DOCX rendered");
                        })
                        .catch(e => {
                            console.error("Error rendering DOCX:", e);
                            if(container) container.innerHTML = "<p>Error previewing file.</p>";
                        });
                })
                .catch(e => {
                     console.error("Error fetching blob:", e);
                     if(container) container.innerHTML = "<p>Error loading file.</p>";
                });
        }
    }, [fileUrl, isDocx]); // Chạy lại nếu file thay đổi

    // 5. --- LOGIC MỚI CHO EXCEL (ĐÃ FIX LỖI CÚ PHÁP) ---
     useEffect(() => {
        // Chỉ chạy nếu nó là .xlsx và cái div đã sẵn sàng
        if (isExcel && excelRef.current) {
            const container = excelRef.current;
            container.innerHTML = "<p>Loading excel preview...</p>";

            fetch(fileUrl)
                .then(response => response.blob()) // <-- ĐỔI SANG BLOB
                .then(blob => {
                    // --- THÊM FILE READER ---
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const arrayBuffer = e.target?.result;
                            if (!arrayBuffer) {
                                throw new Error("File reading failed");
                            }
                            
                            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                            const firstSheetName = workbook.SheetNames[0];
                            // --- FIX LỖI CÚ PHÁP: THÊM LẠI 3 DÒNG BỊ MẤT ---
                            const worksheet = workbook.Sheets[firstSheetName];
                            const html = XLSX.utils.sheet_to_html(worksheet);

                            const styledHtml = `
                                <style>
                                    table { 
                                        border-collapse: collapse; 
                                        width: 100%; 
                                        font-size: 12px; 
                                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                    }
                                    th, td { 
                                        border: 1px solid #ddd; 
                                        padding: 6px; 
                                        text-align: left;
                                    }
                                    th { 
                                        background-color: #f8f9fa; 
                                        font-weight: 600;
                                        position: sticky; /* Cho header nó dính */
                                        top: 0;
                                    }
                                    tr:nth-child(even) {
                                        background-color: #f2f2f2;
                                    }
                                </style>
                                ${html}
                            `; // <-- ĐÓNG CÁI TEMPLATE LẠI

                            container.innerHTML = styledHtml; // <-- SET CÁI HTML VÀO

                        } catch (err) { // <-- SỬA LẠI BIẾN LỖI
                             console.error("Error rendering Excel:", err);
                             if(container) container.innerHTML = "<p>Error previewing file (read failed).</p>";
                        }
                    };
                    reader.onerror = (err) => {
                        console.error("FileReader error:", err);
                        if(container) container.innerHTML = "<p>Error reading file blob.</p>";
                    }
                    reader.readAsArrayBuffer(blob); // <-- BẮT ĐẦU ĐỌC
                    // --- KẾT THÚC FILE READER ---
                })
                .catch(e => {
                     console.error("Error fetching blob:", e);
                     if(container) container.innerHTML = "<p>Error loading file.</p>";
                });
        }
    }, [fileUrl, isExcel]); // Chạy lại nếu file thay đổi


    // Nếu là .docx, trả về cái div để "vẽ"
    if (isDocx) {
        return (
            <div 
                ref={docxRef} 
                className="w-full h-[70vh] overflow-auto bg-white p-4 border rounded"
            >
                {/* docx-preview sẽ render vào đây */}
            </div>
        );
    }
    
    // Nếu là .xlsx, trả về cái div để "vẽ"
     if (isExcel) {
        return (
            <div 
                ref={excelRef} 
                className="w-full h-[70vh] overflow-auto bg-white border rounded"
            >
                {/* sheetjs sẽ render vào đây */}
            </div>
        );
    }
    // --- KẾT THÚC LOGIC MỚI ---
    
    // 6. Fallback (như cũ)
    const friendlyExtension = getFriendlyExtension(fileType || "", file.fileName || "");

    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Preview not available</h3>
            <p className="text-sm text-gray-500 mb-4">
                {/* Sửa chỗ này */}
                Cannot preview this file type {friendlyExtension ? `(${friendlyExtension})` : ''}.
            </p>
            <Button asChild>
                <a href={fileUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </a>
            </Button>
        </div>
    )
}