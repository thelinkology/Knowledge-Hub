import { useState, useEffect } from 'react'

const MAX_WIDTH_MOBILE = 768

export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < MAX_WIDTH_MOBILE)
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return isMobile
}
