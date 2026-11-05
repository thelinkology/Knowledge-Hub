import { type CommonProps } from '@/@types/common'
import { toastInfo } from '@/components/ui/toast/toast'
import classNames from '@/utils/classNames'

export const onFileDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const a = e?.currentTarget,
        url = a?.href,
        name = a?.download
    if (!url) {
        e.preventDefault()
        return
    } // if no download url, prevent default action
    const name2 = name || url.split('/').pop() || 'file'
    toastInfo(`Downloading ${name2}...`, { duration: 5000 })
}

export interface FileDownloadLinkProps extends CommonProps {
    name: string
    url?: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    title?: string
}
export default function FileDownloadLink({
    name,
    url,
    className,
    onClick = onFileDownload,
    title,
    children,
}: FileDownloadLinkProps) {
    return (
        // use <a> tag to allow download instead of <Link> tag, as the <Link> tag will do a pre-fetch of each link (unecessary for downloads)
        <a
            download={name}
            href={url || '#'}
            target="_blank"
            rel="noreferrer"
            onClick={onClick}
            className={classNames('no-underline w-full', className)}
            title={title}
        >
            {children}
        </a>
    )
}
