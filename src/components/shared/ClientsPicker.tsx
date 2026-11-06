'use client'

import { useMemo } from 'react'
import Select from '@/components/ui/Select'
import { useSWRClients } from '@/services/clients'

type Option = { value: string; label: string }

interface ClientsPickerProps {
    inputId: string
    value: string[]
    onChange: (clientIds: string[]) => void
    placeholder?: string
    isDisabled?: boolean
}

/** Picks several clients (by name, searchable) — for people's and API keys' client access */
export default function ClientsPicker({ inputId, value, onChange, placeholder, isDisabled }: ClientsPickerProps) {
    const clients = useSWRClients()
    const options = useMemo<Option[]>(
        () => (clients.data ?? []).map((client) => ({ value: client.id, label: client.name })),
        [clients.data],
    )
    return (
        <Select<Option, true>
            inputId={inputId}
            isMulti
            options={options}
            isLoading={clients.isLoading && !clients.data}
            isDisabled={isDisabled}
            placeholder={placeholder ?? 'Pick clients'}
            noOptionsMessage={() => (clients.data?.length ? 'No more clients' : 'No clients yet')}
            value={options.filter((option) => value.includes(option.value))}
            onChange={(selected) => onChange(selected.map((option) => option.value))}
            menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
            menuPosition="fixed"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
        />
    )
}
