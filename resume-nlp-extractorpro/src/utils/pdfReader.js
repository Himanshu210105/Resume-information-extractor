// ── PDF Text Extractor using pdf.js ───────────────────────────
// Uses pdfjs-dist to read PDF files directly in the browser

export async function extractTextFromPDF(file) {
  // Dynamically import pdfjs to keep bundle smaller
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker — use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Sort text items by vertical position (y), then horizontal (x)
    // This ensures correct reading order
    const items = content.items.sort((a, b) => {
      const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
      if (Math.abs(yDiff) > 3) return yDiff; // different lines
      return a.transform[4] - b.transform[4]; // same line, left to right
    });

    let lastY = null;
    let lineText = '';

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      const text = item.str;

      if (lastY !== null && Math.abs(y - lastY) > 3) {
        // New line
        if (lineText.trim()) fullText += lineText.trim() + '\n';
        lineText = text;
      } else {
        // Same line — add space if needed
        if (lineText && !lineText.endsWith(' ') && text && !text.startsWith(' ')) {
          lineText += ' ';
        }
        lineText += text;
      }
      lastY = y;
    }

    if (lineText.trim()) fullText += lineText.trim() + '\n';
    fullText += '\n'; // page separator
  }

  return fullText.trim();
}
