import React from 'react';
import type { PDF, PDFResponse,} from "@/features/curriculum/types";
import { useResponse } from '../hooks';
import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';


interface PDFProps {
    pdf: PDF
}


export default function PDF({pdf}: PDFProps){
    
    useResponse<PDFResponse, PDF>({
        activity: pdf,
        initialFields: { attempts_left: 0, partial_response: false },
    });

    const [isClient, setIsClient] = useState(false);
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);

    useEffect(() => {
        setIsClient(true);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }
    

    return(
        <Document file={pdf.pdf_file} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (stuff, index) =>(
                <Page pageNumber={index + 1}/>
            ))}
        </Document>
    );
}