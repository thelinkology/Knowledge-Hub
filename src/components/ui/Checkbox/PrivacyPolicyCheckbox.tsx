'use client'

import { privacyPolicyUrl } from '@/configs/app.config'
import Checkbox, { type CheckboxProps } from '.'
import Link from 'next/link'

interface PrivacyPolicyCheckboxProps extends CheckboxProps {
    disclaimer?: React.ReactNode
}
const PrivacyPolicyCheckbox = (props: PrivacyPolicyCheckboxProps) => {
    const { disclaimer, ...rest } = props
    return (
        <>
            <Checkbox {...rest}>
                I agree to the{' '}
                <Link className="text-gray underline" href={privacyPolicyUrl} target="_blank">
                    Privacy Policy
                </Link>
            </Checkbox>
            {disclaimer && <p className="text-xs text-gray-600 mt-2">{disclaimer}</p>}
        </>
    )
}
export default PrivacyPolicyCheckbox
