import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommonProps } from '../@types/common'
import type { ImgHTMLAttributes, ReactNode, SyntheticEvent } from 'react'

export interface ImageProps extends CommonProps, ImgHTMLAttributes<HTMLImageElement> {
    fallback: ReactNode
}
const Image = (props: ImageProps) => {
    const { fallback, alt, hidden, onError, onLoad, ...rest } = props

    const ref = useRef(null as HTMLImageElement | null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    useEffect(() => {
        if (ref && ref.current) {
            // initialise values when image is mounted
            setIsLoading(!ref.current.complete)
            setIsError(ref.current.naturalWidth === 0)
        }
    }, [ref])

    const onErrorCustom = useCallback(
        (e: SyntheticEvent<HTMLImageElement, Event>) => {
            //console.info("image error", e);
            setIsLoading(false)
            setIsError(true)
            onError?.(e)
        },
        [setIsLoading, setIsError, onError],
    )
    const onLoadCustom = useCallback(
        (e: SyntheticEvent<HTMLImageElement, Event>) => {
            //console.info("image loaded", e);
            setIsLoading(false)
            setIsError(false)
            onLoad?.(e)
        },
        [setIsLoading, setIsError, onLoad],
    )

    return (
        <>
            {(isLoading || isError) && fallback}
            <img
                ref={ref}
                hidden={hidden || isLoading || isError}
                alt={alt}
                onError={onErrorCustom}
                onLoad={onLoadCustom}
                {...rest}
            />
        </>
    )
}
export default Image
