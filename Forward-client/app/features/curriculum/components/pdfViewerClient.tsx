import { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import MarkdownTTS from '@/components/ui/markdown-tts';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

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
  const[scale, setScale] = useState<number>(1.2); // This sets the zoom at a default of 120% percent

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
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3)); // Max 300%
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5)); // Min 50%
  };

  const handleResetZoom = () => {
    setScale(1.2);
  }

  return (

    <div className="flex flex-col h-full max-h-[80vh] bg-muted rounded-lg overflow-hidden shadow-sm">

      {/*Zoom in Zoom Out Header Stuff*/}
      <div className="bg-background border-b border-border px-4 py-2 flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        
        <button
          onClick={handleZoomIn}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          onClick={handleResetZoom}
          className="ml-2 px-3 py-1 text-sm rounded hover:bg-muted transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

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
              <Page pageNumber={index + 1}  scale = {scale} onLoadSuccess={(page: any) => onPageLoadSuccess(index + 1, page)} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )

}