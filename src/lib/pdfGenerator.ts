import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateDirectPDF(elementId: string, filename: string, transcriptOnly = false) {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    alert("Scribe document not found.");
    return;
  }

  // To simulate the 'print' layout, we MUST clone the element and force styling
  const clone = originalElement.cloneNode(true) as HTMLElement;
  
  // Create an off-screen container that mimics an A4 printed page
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.padding = '20mm';
  
  // Force Tailwind print-like overrides on the clone
  clone.style.backgroundColor = 'white';
  clone.style.color = 'black';
  clone.style.boxShadow = 'none';
  clone.style.margin = '0px';
  clone.style.border = 'none';
  
  // Hide UI elements manually for the clone
  const hideSelects = clone.querySelectorAll('select, button, .print\\:hidden');
  hideSelects.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });

  // Force text elements to black
  const texts = clone.querySelectorAll('h1, h2, h3, p, span, div, li, td, th');
  texts.forEach(el => {
    (el as HTMLElement).style.color = 'black';
  });

  if (transcriptOnly) {
    // Hide everything except the transcript
    const sections = clone.querySelectorAll('.scribe-section');
    sections.forEach(el => {
      if (!el.classList.contains('transcript-section')) {
        (el as HTMLElement).style.display = 'none';
      }
    });
  }

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If the content is longer than one page, jsPDF handles it if we slice it, 
    // but for simplicity we'll insert it as one long scrolling image or scaled to fit.
    // For a multi-page A4, we need to add pages.
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error: any) {
    console.error("PDF Generation failed:", error);
    alert("PDF Generation failed: " + (error?.message || error?.toString() || "Unknown canvas error."));
  } finally {
    document.body.removeChild(container);
  }
}
