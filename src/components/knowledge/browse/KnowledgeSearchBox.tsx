'use client'

import { useId, useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import { CloseIcon, SearchIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'

interface KnowledgeSearchBoxProps {
    /** The current query (the box resets when it changes; give it `key={query}`) */
    defaultValue?: string
    onSearch: (query: string) => void
    placeholder?: string
    autoFocus?: boolean
    className?: string
}

/** The big hero search box (knowledge browser and home page) */
export default function KnowledgeSearchBox({
    defaultValue = '',
    onSearch,
    placeholder = 'Search articles, scripts, flows, architectures…',
    autoFocus,
    className,
}: KnowledgeSearchBoxProps) {
    const id = useId()
    const [text, setText] = useState(defaultValue)

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        onSearch(text.trim())
    }

    return (
        <form role="search" onSubmit={onSubmit} className={classNames('flex w-full gap-2', className)}>
            <label htmlFor={id} className="sr-only">
                Search knowledge and the library
            </label>
            <div className="relative min-w-0 flex-1">
                <SearchIcon
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
                />
                <input
                    id={id}
                    type="search"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    maxLength={200}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-12 pr-10 text-base text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/30 md:h-14 md:text-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 [&::-webkit-search-cancel-button]:hidden"
                />
                {text && (
                    <button
                        type="button"
                        aria-label="Clear the search"
                        onClick={() => {
                            setText('')
                            if (defaultValue) onSearch('')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>
            <Button type="submit" variant="solid" className="h-12 shrink-0 md:h-14" icon={<SearchIcon />}>
                <span className="hidden sm:inline">Search</span>
                <span className="sr-only sm:hidden">Search</span>
            </Button>
        </form>
    )
}
