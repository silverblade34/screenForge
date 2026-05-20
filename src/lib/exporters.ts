import type jsPDF from 'jspdf';

export async function exportElementToPDF(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

export async function exportElementToPNG(
  element: HTMLElement,
  filename: string,
  scale = 2,
) {
  const html2canvas = (await import('html2canvas')).default;

  // Temporarily hide decorative-only elements (reflections, glows)
  // that html2canvas renders incorrectly (ignores mask-image, etc.)
  const hidden = Array.from(
    element.querySelectorAll<HTMLElement>('[data-export-hide="true"]'),
  );
  hidden.forEach(el => { el.style.visibility = 'hidden'; });

  let canvas: HTMLCanvasElement;
  try {
    // Get the element's position relative to the page to capture only this element
    const rect = element.getBoundingClientRect();
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      // Correct for any page scroll so the capture aligns with the element
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      // Clip to the element's visible area only
      x: rect.left + window.scrollX,
      y: rect.top  + window.scrollY,
      width:  rect.width,
      height: rect.height,
    });
  } finally {
    hidden.forEach(el => { el.style.visibility = ''; });
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportHTMLToPDF(
  htmlContent: string,
  filename: string,
  options?: {
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  }
) {
  const { jsPDF } = await import('jspdf');
  const format = options?.format || 'a4';
  const orientation = options?.orientation || 'portrait';
  const margin = options?.margin ?? 20;

  const pdf = new (jsPDF as unknown as new (opts: {
    orientation: string;
    unit: string;
    format: string;
  }) => jsPDF)({
    orientation,
    unit: 'mm',
    format,
  });

  await pdf.html(htmlContent, {
    callback: (doc: jsPDF) => {
      doc.save(filename);
    },
    margin: [margin, margin, margin, margin],
    html2canvas: { scale: 0.264583 },
  });
}

export function downloadSVG(svgElement: SVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
