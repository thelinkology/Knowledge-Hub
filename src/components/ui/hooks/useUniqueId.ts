import { useRef } from 'react'
import createUID from '../utils/createUid'

let counter = 0

export default function useUniqueId(prefix = '', len = 10) {
    const idRef = useRef<string>(undefined)

    if (!idRef.current) {
        idRef.current = `${prefix}${++counter}-${createUID(len)}`
    }

    return idRef.current
}
