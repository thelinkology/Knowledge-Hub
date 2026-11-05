'use client'

import { useState } from 'react'
import Input, { type InputProps } from '@/components/ui/Input'
import { HidePasswordIcon, ShowPasswordIcon } from '@/configs/icons.config'

/** A password field with a show/hide button — fewer typos, especially on phones. */
export default function PasswordInput(props: Omit<InputProps, 'type' | 'suffix'>) {
    const [visible, setVisible] = useState(false)
    return (
        <Input
            {...props}
            type={visible ? 'text' : 'password'}
            suffix={
                <button
                    type="button"
                    className="flex items-center text-lg text-gray-400 hover:text-primary"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                >
                    {visible ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                </button>
            }
        />
    )
}
