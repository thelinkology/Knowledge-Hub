import Button, { type ButtonProps } from './Button'
//import { TbDeviceFloppy } from "react-icons/tb";

export default function SaveButton(props: ButtonProps) {
    return (
        <Button
            variant="solid"
            //icon={<TbDeviceFloppy />}
            {...props}
        />
    )
}
