import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

export async function extractPdfText(
  file: File
): Promise<{ text: string; pages: number }> {
  // Dynamically import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist')

  // ✅ FIXED: matches your installed pdfjs-dist v5.5.207
  // v5 uses .mjs worker, not .min.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text +=
      content.items
        .map((item: TextItem | TextMarkedContent) =>
          'str' in item ? item.str : ''
        )
        .join(' ') + '\n\n'
  }

  return { text: text.trim(), pages: pdf.numPages }
}