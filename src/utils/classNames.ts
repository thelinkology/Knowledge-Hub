import cn from 'classnames'
import { twMerge } from 'tailwind-merge'

/** `classnames` + `tailwind-merge`: conditional classes where the last conflicting utility wins */
export default function classNames(...args: cn.ArgumentArray) {
    return twMerge(cn(args))
}
