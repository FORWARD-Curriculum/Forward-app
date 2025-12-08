import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

interface PDFViewerClientProps {
  pdfUrl: string;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PDFViewerClient({ pdfUrl }: PDFViewerClientProps) {
  const [numPages, setNumPages] = useState<number>();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <Document file={{url: pdfUrl}} onLoadSuccess={onDocumentLoadSuccess}>
        {numPages && Array.from(new Array(numPages), (el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
    </Document>
  )

}