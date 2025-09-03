export interface CreditLimitInfo {
  requestCost: number
  remaining: number
  resetsIn: number
}

export function parseCreditHeaders(headers: Headers): CreditLimitInfo {
  const requestCost = parseInt(headers.get('X-RequestCost') || '0', 10)
  const remaining = parseInt(headers.get('X-FiveMinCreditLimit-Remaining') || '999', 10)
  const resetsIn = parseInt(headers.get('X-FiveMinCreditLimit-ResetsIn') || '300', 10)

  return {
    requestCost,
    remaining,
    resetsIn
  }
}

export function shouldBackoff(remaining: number, threshold: number = 50): boolean {
  return remaining <= threshold
}

export async function sleepUntilReset(resetsInSeconds: number): Promise<void> {
  const sleepMs = Math.min(resetsInSeconds * 1000, 300000) // Max 5 minutes
  console.log(`Rate limited. Sleeping for ${sleepMs}ms...`)
  
  return new Promise(resolve => {
    setTimeout(resolve, sleepMs)
  })
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly remaining: number,
    public readonly resetsIn: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}