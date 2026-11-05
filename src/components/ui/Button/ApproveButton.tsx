import Button, { type ButtonProps } from './Button'
import { ApproveIcon } from '@/configs/icons.config'
import classNames from '../utils/classNames'

export default function ApproveButton(props: ButtonProps & { selected?: boolean }) {
    return (
        <Button
            variant="solid"
            customColorClass={() =>
                //({ active, unclickable })
                classNames(
                    'ltr:mr-3 rtl:ml-3',
                    'border-success ring-1 ring-success text-success bg-transparent',
                    `border-0 hover:ring-0 ${props.selected ? 'text-white bg-green-500' : 'hover:text-white'} hover:bg-green-500`, //'hover:border-success hover:ring-success hover:text-white hover:bg-success',
                    //'bg-green-500 text-white',
                    //'hover:text-green-800 dark:hover:bg-green-600 border-0 hover:ring-0',
                    //active && 'bg-green-200',
                    //unclickable && 'opacity-50 cursor-not-allowed',
                    //!active && !unclickable && 'hover:bg-green-200',
                )
            }
            icon={<ApproveIcon />}
            {...props}
        />
    )
}
