import React from 'react';
import type { PDF, PDFResponse,} from "@/features/curriculum/types";
import { useResponse } from '../hooks';
import { useState, useEffect, lazy, Suspense } from 'react';


/**
 * So this package for viewing pdfs depends on Broswer API
 * But before its rendered client side, components are processed on NEXT.js server,
 * At that moment this breaks because it expects broswer api connection
 * So the lazy load make it so the actual pdfviewer is only unpacked once we arrive on the client side browser
 */
const LazyPDFViewer = lazy(() => 
  import('./pdfViewerClient').catch(() => ({
    default: () => (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-primary-foreground">Failed to load PDF viewer</p>
      </div>
    )
  }))
);


interface PDFProps {
    pdf: PDF
}


export default function PDF({pdf}: PDFProps){
    
    useResponse<PDFResponse, PDF>({
        activity: pdf,
        initialFields: { attempts_left: 0, partial_response: false },
    });

    const [isClient, setIsClient] = useState(false);
   

    // Only render PDF viewer on client-side to avoid SSR issues
    useEffect(() => {
        setIsClient(true);
    }, []);


    if (!isClient){
        return (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <p className="text-muted-foreground">Loading PDF viewer...</p>
            </div>
        )
    }
    
    return(
        <div className="w-full">
            <Suspense fallback={
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                    <p className='text-muted-foreground'>Loading PDF...</p>
                </div>}>
                <LazyPDFViewer pdfUrl={pdf.pdf_file} />
            </Suspense>
        </div>
    );
}