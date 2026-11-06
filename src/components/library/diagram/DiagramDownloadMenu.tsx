'use client'

import { useState, type RefObject } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { toastError } from '@/components/ui/toast/toast'
import { DownloadIcon, ExpandIcon } from '@/configs/icons.config'
import { diagramFileName, diagramToMarkdown, kindsInView } from '@/utils/diagram'
import useDiagramComponents from '@/utils/hooks/useDiagramComponents'
import { saveDiagramPdf, saveFile, saveText } from './downloadDiagram'
import type { Diagram, DiagramView } from '@/@types/library/Diagram'
import type { DiagramCanvasExporter } from './DiagramCanvas'

interface DiagramDownloadMenuProps {
    diagram: Diagram
    /** The view on screen (the one PNG / JPG / PDF show) */
    view: DiagramView
    /** The asset's title (headings and file names) */
    title: string
    /** The canvas's exporter (DiagramCanvas exportRef) */
    exporter: RefObject<DiagramCanvasExporter | null>
    className?: string
}

type Format = 'png' | 'jpg' | 'pdf' | 'md'

/**
 * "Download ▾": the view on screen as a PNG or JPG picture or a PDF (picture, legend, notes and build
 * sequence), or every view as a Markdown brief.
 */
export default function DiagramDownloadMenu({ diagram, view, title, exporter, className }: DiagramDownloadMenuProps) {
    const { components, resolve } = useDiagramComponents()
    const [busy, setBusy] = useState(false)
    const hasNodes = view.nodes.length > 0

    const download = async (format: Format) => {
        if (format === 'md') {
            saveText(
                diagramToMarkdown(diagram, title, components),
                diagramFileName(title),
                'text/markdown;charset=utf-8',
            )
            return
        }
        const canvas = exporter.current
        if (!canvas) {
            toastError('The diagram is still loading. Try again in a moment.')
            return
        }
        setBusy(true)
        try {
            const extension = format
            const fileName = diagramFileName(title, { name: view.name, extension })
            const image = await canvas.toImage(format === 'png' ? 'png' : 'jpeg')
            if (format === 'pdf') {
                await saveDiagramPdf({ title, view, image, legend: kindsInView(view, components), resolve, fileName })
            } else {
                saveFile(image.dataUrl, fileName)
            }
        } catch (error) {
            toastError('The diagram couldn’t be downloaded. Try again, or download the brief instead.', error)
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dropdown
            placement="bottom-end"
            className={className}
            renderTitle={
                <Button size="xs" icon={<DownloadIcon />} loading={busy} disabled={busy}>
                    <span className="inline-flex items-center gap-1">
                        Download <ExpandIcon aria-hidden />
                    </span>
                </Button>
            }
            disabled={busy}
        >
            <Dropdown.Item eventKey="png" disabled={!hasNodes} onClick={() => void download('png')}>
                This view as PNG image
            </Dropdown.Item>
            <Dropdown.Item eventKey="jpg" disabled={!hasNodes} onClick={() => void download('jpg')}>
                This view as JPG image
            </Dropdown.Item>
            <Dropdown.Item eventKey="pdf" disabled={!hasNodes} onClick={() => void download('pdf')}>
                This view as PDF
            </Dropdown.Item>
            <Dropdown.Item eventKey="md" onClick={() => void download('md')}>
                Brief of every view (Markdown)
            </Dropdown.Item>
        </Dropdown>
    )
}
