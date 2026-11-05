'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getKnowledgeSearchPath, searchPath } from '@/configs/app.config'
import { SearchIcon } from '@/configs/icons.config'
import useSession from '@/utils/hooks/useSession'

/** Header search — opens the knowledge browser with the results for the query. */
export default function HeaderSearch() {
    const router = useRouter()
    const { can } = useSession()
    const [query, setQuery] = useState('')
    if (!can('knowledge.read')) return null

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        const q = query.trim()
        router.push(q ? getKnowledgeSearchPath(q) : searchPath)
    }

    return (
        <form onSubmit={onSubmit} className="hidden md:block" role="search">
            <label className="relative block">
                <span className="sr-only">Search knowledge and the library</span>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search knowledge, scripts, architectures…"
                    className="h-10 w-80 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
            </label>
        </form>
    )
}
