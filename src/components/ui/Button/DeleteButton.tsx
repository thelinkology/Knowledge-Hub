import Button, { type ButtonProps } from './Button'
import classNames from '@/utils/classNames'
import { TbTrash } from 'react-icons/tb'

export default function DeleteButton(props: ButtonProps) {
    return (
        <Button
            variant="solid"
            customColorClass={() =>
                //({ active, unclickable })
                classNames(
                    'ltr:mr-3 rtl:ml-3',
                    'border-error ring-1 ring-error text-error bg-transparent',
                    'border-0 hover:ring-0 hover:text-white hover:bg-red-500', //'hover:border-error hover:ring-error hover:text-white hover:bg-error',
                    //'bg-red-500 text-white',
                    //'hover:text-red-800 dark:hover:bg-red-600 border-0 hover:ring-0',
                    //active && 'bg-red-200',
                    //unclickable && 'opacity-50 cursor-not-allowed',
                    //!active && !unclickable && 'hover:bg-red-200',
                )
            }
            icon={<TbTrash />}
            {...props}
        />
    )
}
