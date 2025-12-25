
"use client";
import React from "react";
import PdfViewer from "../chat-team/components/PdfViewer";

const page = () => {
  const file =
    "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf";
  const [isPdfLoading, setIsPdfLoading] = React.useState(false);
  return <PdfViewer file={file} setIsPdfLoading={setIsPdfLoading} />;
};

export default page;
