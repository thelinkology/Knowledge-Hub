import { useCallback, useEffect, useState } from 'react'
//import type { MouseEvent } from 'react'
import classNames from '@/utils/classNames'

interface ExpandableTextProps {
    className?: string
    text: string
    expanded?: boolean
    maxLength?: number
}
const ExpandableText = (props: ExpandableTextProps) => {
    const { className, text, expanded: initialExpanded = false, maxLength = 200 } = props
    //
    const [expanded, setExpanded] = useState(initialExpanded)
    useEffect(() => setExpanded(initialExpanded), [initialExpanded]) // update state if initialExpanded changes
    const handleToggle = useCallback((/*e: MouseEvent*/) => setExpanded(!expanded), [expanded])
    //
    if (!text) {
        return null
    }
    if (text.length <= maxLength) {
        return <span className={className}>{text}</span>
    }
    return (
        <div>
            <span className={classNames(expanded ? '' : 'line-clamp-2', className)}>{text}</span>
            <button type="button" onClick={handleToggle} className="text-blue-500 ml-1">
                {expanded ? 'Show less' : 'Show more'}
            </button>
        </div>
    )
}
export default ExpandableText
