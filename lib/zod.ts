import { z } from 'zod'

export function zodErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((i) => i.message).join('; ')
  }
  return null
}

