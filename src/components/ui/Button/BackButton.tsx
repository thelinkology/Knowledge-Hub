import Button, { type ButtonProps } from './Button'
import { TbArrowNarrowLeft } from 'react-icons/tb'

export default function BackButton(props: ButtonProps) {
    return <Button variant="solid" icon={<TbArrowNarrowLeft />} {...props} />
}
