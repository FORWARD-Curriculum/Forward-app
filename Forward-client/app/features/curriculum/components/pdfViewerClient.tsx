import { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import MarkdownTTS from '@/components/ui/markdown-tts';

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
  const[pageTexts, setPageTexts] = useState<string[]>([]);

  const file = useMemo(() => ({ url: pdfUrl }), [pdfUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageTexts(new Array(numPages).fill(''));
  }

  //fill our array with each pages content. Used for the text to speech to render by page instead of for the
  // entire pdf
  async function onPageLoadSuccess(pageNumber: number, page: any){
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any)=>item.str).join(' ')

    setPageTexts(prev => {
      const updated = [...prev]
      updated[pageNumber - 1] = pageText;
      return updated
    });
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
          file={file} 
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center gap-4"
        >
          {numPages && Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="relative shadow-md">
              {/**A play button for each page in the pdf for its respective Text to speech content */}
              {pageTexts[index] && (
                <div className='absolue top-2 right-2 z-10'>
                  <MarkdownTTS
                    controlsClassName="flex gap-2"
                    controlsOrientation='horizontal'
                    hideContent={true} // makes the content not wrapped/displayed by the hook. If left unchecked it would display the text its reading, which is unecessary since we see it in pdf viewer
                  >
                    {pageTexts[index]}
                  </MarkdownTTS>
                </div>
              )}
              <Page pageNumber={index + 1}  onLoadSuccess={(page: any) => onPageLoadSuccess(index + 1, page)} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )

}