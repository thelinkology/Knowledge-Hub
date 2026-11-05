import { NextResponse } from 'next/server'
import { apiAuthHandler, readId } from '@/server/routes/api'
import { getMediaViewUrl } from '@/server/actions/media'

/** An image in content: any signed-in user → a short-lived signed URL */
export const GET = apiAuthHandler<{ mediaId: string }>('knowledge.read', async (_req, ctx) => {
    const url = await getMediaViewUrl(readId((await ctx.params).mediaId, 'image'))
    return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'private, max-age=300' } })
})
