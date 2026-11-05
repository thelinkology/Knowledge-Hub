import Container from '@/components/shared/Container'
import classNames from '@/utils/classNames'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { portalName, privacyPolicyUrl, termsOfUseUrl } from '@/configs/app.config'

export type FooterPageContainerType = 'gutterless' | 'contained'

type FooterProps = {
    pageContainerType: FooterPageContainerType
    className?: string
}

const FooterContent = () => {
    return (
        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between flex-auto w-full gap-2 md:gap-4">
            <span className="flex flex-row flex-wrap gap-1">
                <span className="font-semibold whitespace-nowrap">{portalName}</span>
                <span title={`Copyright ${new Date().getFullYear()}`}>&copy; {new Date().getFullYear()}</span>
                <span>All rights reserved</span>
            </span>
            <div className="flex flex-row flex-wrap gap-1">
                <a className="text-gray" href={termsOfUseUrl} target="_blank" rel="noreferrer">
                    Terms &amp; Conditions
                </a>
                <span className="mx-2 text-muted">|</span>
                <a className="text-gray" href={privacyPolicyUrl} target="_blank" rel="noreferrer">
                    Privacy Policy
                </a>
            </div>
        </div>
    )
}

export default function Footer({ pageContainerType = 'contained', className }: FooterProps) {
    return (
        <footer
            className={classNames(
                `footer flex flex-auto items-center h-16 ${PAGE_CONTAINER_GUTTER_X} print:hidden`,
                className,
            )}
        >
            {pageContainerType === 'contained' ? (
                <Container>
                    <FooterContent />
                </Container>
            ) : (
                <FooterContent />
            )}
        </footer>
    )
}
