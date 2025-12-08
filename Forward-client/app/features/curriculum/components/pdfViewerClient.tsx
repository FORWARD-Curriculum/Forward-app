import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFViewerClientProps {
  pdfUrl: string;
}

// This worker is required per the documentation. Not really sure what it does but its dependency 
// needs to be exactly the version I left it at because any variation can and will break it
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

    <div className="flex flex-col h-full max-h-[80vh] bg-muted rounded-lg overflow-hidden shadow-sm">

      {/* Header, Just shows the number of pages we have */}
      {numPages && (
        <div className="px-4 py-2 bg-secondary border-b border-secondary-border">
          <p className="text-sm text-secondary-foreground">
            {numPages} {numPages === 1 ? 'page' : 'pages'}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-background p-4">
        <Document 
          file={{url: pdfUrl}} 
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center gap-4"
        >
          {numPages && Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="shadow-md">
              <Page pageNumber={index + 1} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )

}