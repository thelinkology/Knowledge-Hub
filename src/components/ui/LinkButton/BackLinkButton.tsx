import LinkButton, { type LinkButtonProps } from './LinkButton'
import { TbArrowNarrowLeft } from 'react-icons/tb'

const BackLinkButton = (props: LinkButtonProps) => (
    <LinkButton className="ltr:mr-3 rtl:ml-3" type="button" variant="plain" icon={<TbArrowNarrowLeft />} {...props} />
)
export default BackLinkButton
