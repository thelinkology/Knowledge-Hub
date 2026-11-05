import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

type DateInput = Date | string | number | null | undefined

export const formatDate = (value: DateInput, fallback = '—') => (value ? dayjs(value).format('D MMM YYYY') : fallback)

export const formatDateTime = (value: DateInput, fallback = '—') =>
    value ? dayjs(value).format('D MMM YYYY, h:mm a') : fallback

export const fromNow = (value: DateInput, fallback = '—') => (value ? dayjs(value).fromNow() : fallback)

/** "45 min", "1 h 30 min" */
export const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return null
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

/** For <input type="datetime-local"> values (local time, no seconds) */
export const toDateTimeLocalValue = (value: Date | null | undefined) =>
    value ? dayjs(value).format('YYYY-MM-DDTHH:mm') : ''
