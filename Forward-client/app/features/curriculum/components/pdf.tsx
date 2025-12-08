import React from 'react';
import type { PDF, PDFResponse,} from "@/features/curriculum/types";
import { useResponse } from '../hooks';
import { useState, useEffect, lazy, Suspense } from 'react';

const LazyPDFViewer = lazy(() => 
  import('./pdfViewerClient').catch(() => ({
    default: () => <div>Failed to load PDF viewer</div>
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
   

    // need to change this to something that actually runs once and once only
    useEffect(() => {
        setIsClient(true);
    }, []);


    if (!isClient){
        return (
            <div>
                <p>This is Loading</p>
            </div>
        )
    }
    
    return(
        <Suspense fallback={<div>Loading PDF...</div>}>
            <LazyPDFViewer pdfUrl={pdf.pdf_file} />
        </Suspense>
    );
}