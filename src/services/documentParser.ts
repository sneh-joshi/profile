import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isReadableContent(text: string): boolean {
  const letters = (text.match(/[A-Za-z]/g) ?? []).length
  const total = text.length || 1
  const ratio = letters / total

  const hasPdfNoise = /%PDF-|\/Type\s*\/|\/Font|endobj|xref|stream|obj\s*<</.test(text)
  return ratio > 0.45 && !hasPdfNoise
}

async function parsePdf(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const task = pdfjsLib.getDocument({ data: bytes })
  const pdf = await task.promise

  const pages: string[] = []

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo)
    const content = await page.getTextContent()

    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (pageText.length > 0) {
      pages.push(pageText)
    }
  }

  const merged = normalizeText(pages.join('\n\n'))
  if (!merged || !isReadableContent(merged)) {
    throw new Error('Could not extract readable text from this PDF. Try a text-based PDF or TXT file.')
  }

  return merged
}

async function parseText(file: File): Promise<string> {
  const text = await file.text()
  const normalized = normalizeText(text)
  if (!normalized) {
    throw new Error('Uploaded text file is empty.')
  }
  return normalized
}

export async function parseFile(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  return isPdf ? parsePdf(file) : parseText(file)
}
