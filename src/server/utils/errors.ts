import 'server-only'
import { AppError } from '@/@types/errors'

/** For server pages: turn "not found / not yours" from an action into notFound() */
export const isNotFound = (error: unknown) =>
    error instanceof AppError && (error.status === 404 || error.status === 403)
