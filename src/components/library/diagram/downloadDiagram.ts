'use client'

import { buildSequence, fitWithin, markdownToPlainText, pdfText } from '@/utils/diagram'
import type { DiagramView } from '@/@types/library/Diagram'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'
import type { DiagramImage } from './DiagramCanvas'

/*
 * Downloads of an architecture diagram, in the browser: the Markdown brief, the view as a PNG / JPG
 * (taken by DiagramCanvas's exporter) and a PDF (jsPDF, loaded on demand) with the title, the view's
 * description, the picture, a legend, the notes and the build sequence.
 */

/** Saves a URL (object or data URL) as a file */
export function saveFile(url: string, fileName: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
}

export function saveText(text: string, fileName: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }))
    saveFile(url, fileName)
    URL.revokeObjectURL(url)
}

/** A type's (light theme) colour as "#rrggbb", read from the stylesheet so it matches the canvas */
function typeColour(component: DiagramComponent): string {
    const probe = document.createElement('span')
    probe.className = `diagram-color-${component.color}`
    probe.style.display = 'none'
    document.body.appendChild(probe)
    const colour = getComputedStyle(probe).getPropertyValue('--diagram-light').trim()
    probe.remove()
    return /^#[0-9a-f]{6}$/i.test(colour) ? colour : '#4a5670'
}

interface DiagramPdfInput {
    /** The asset's title */
    title: string
    view: DiagramView
    image: DiagramImage
    /** Types used in the view, in legend order (kindsInView) */
    legend: DiagramComponent[]
    resolve: (code: string) => DiagramComponent
    fileName: string
}

const MARGIN = 40
const GRAY_900 = '#0b1222'
const GRAY_600 = '#4a5670'

/** A PDF of one view: page 1 holds the heading, the picture (fitted, landscape when wide) and the legend */
export async function saveDiagramPdf({ title, view, image, legend, resolve, fileName }: DiagramPdfInput) {
    const { jsPDF } = await import('jspdf')
    const landscape = image.width >= image.height
    const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const textWidth = pageWidth - MARGIN * 2
    let y = MARGIN

    const ensureSpace = (height: number) => {
        if (y + height <= pageHeight - MARGIN) return
        pdf.addPage()
        y = MARGIN
    }

    /** Wrapped text; returns nothing, moves `y` down */
    const write = (text: string, size: number, options: { bold?: boolean; color?: string; indent?: number } = {}) => {
        pdf.setFont('helvetica', options.bold ? 'bold' : 'normal')
        pdf.setFontSize(size)
        pdf.setTextColor(options.color ?? GRAY_900)
        const indent = options.indent ?? 0
        const lineHeight = size * 1.35
        const lines: string[] = pdf.splitTextToSize(pdfText(text), textWidth - indent)
        for (const line of lines) {
            ensureSpace(lineHeight)
            pdf.text(line, MARGIN + indent, y + size)
            y += lineHeight
        }
    }

    // ── Page 1: heading, picture, legend ──
    write(title, 18, { bold: true })
    write(view.name, 13, { bold: true, color: GRAY_600 })
    if (view.description.trim()) {
        y += 2
        write(view.description.trim(), 10, { color: GRAY_600 })
    }
    y += 10

    const legendHeight = legend.length ? 16 * Math.ceil(legend.length / 4) + 8 : 0
    const box = fitWithin(image.width * 0.75, image.height * 0.75, textWidth, pageHeight - MARGIN - y - legendHeight)
    if (box.height < 120) {
        pdf.addPage()
        y = MARGIN
    }
    const size = fitWithin(image.width * 0.75, image.height * 0.75, textWidth, pageHeight - MARGIN - y - legendHeight)
    pdf.addImage(image.dataUrl, 'JPEG', MARGIN + (textWidth - size.width) / 2, y, size.width, size.height)
    y += size.height + 12

    if (legend.length) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        const column = textWidth / 4
        legend.forEach((component, i) => {
            const x = MARGIN + (i % 4) * column
            const rowY = y + Math.floor(i / 4) * 16
            pdf.setFillColor(typeColour(component))
            pdf.rect(x, rowY + 1, 8, 8, 'F')
            pdf.setTextColor(GRAY_600)
            const label: string[] = pdf.splitTextToSize(pdfText(component.name), column - 18)
            pdf.text(label[0] ?? '', x + 13, rowY + 8)
        })
        y += legendHeight
    }

    // ── Notes ──
    const notes = view.notes.filter((note) => note.text.trim())
    if (notes.length) {
        y += 12
        ensureSpace(40)
        write('Notes', 13, { bold: true })
        y += 2
        for (const note of notes) {
            write(`${note.tone === 'warning' ? 'Warning: ' : 'Note: '}${note.text.trim()}`, 10)
            y += 4
        }
    }

    // ── Build sequence ──
    const sequence = buildSequence(view)
    if (sequence.length) {
        y += 12
        ensureSpace(40)
        write('Build sequence', 13, { bold: true })
        y += 2
        for (const node of sequence) {
            ensureSpace(30)
            write(`${node.step}. ${node.label} (${resolve(node.kind).name})`, 10.5, { bold: true })
            const guidance = markdownToPlainText(node.guidance)
            if (guidance) write(guidance, 9.5, { color: GRAY_600, indent: 14 })
            y += 6
        }
    }

    // Footer on every page
    const pages = pdf.getNumberOfPages()
    for (let page = 1; page <= pages; page++) {
        pdf.setPage(page)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(GRAY_600)
        const footer: string[] = pdf.splitTextToSize(pdfText(`${title} · ${view.name}`), textWidth - 60)
        pdf.text(footer[0] ?? '', MARGIN, pageHeight - 20)
        pdf.text(`${page} / ${pages}`, pageWidth - MARGIN, pageHeight - 20, { align: 'right' })
    }

    pdf.save(fileName)
}
