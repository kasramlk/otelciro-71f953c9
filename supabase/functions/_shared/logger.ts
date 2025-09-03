import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface AuditFields {
  provider?: string
  operation: string
  hotel_id?: string
  external_id?: string
  status: 'success' | 'error' | 'partial'
  request_cost?: number
  credit_limit_remaining?: number
  credit_limit_resets_in?: number
  duration_ms?: number
  request_payload?: any
  response_payload?: any
  error_details?: any
}

const REDACT_KEYS = (() => {
  try {
    const keys = Deno.env.get('LOG_REDACT_KEYS')
    const parsed = keys ? JSON.parse(keys) : ['token', 'authorization', 'email', 'phone']
    console.log('LOG_REDACT_KEYS loaded:', JSON.stringify(parsed))
    return parsed
  } catch (error) {
    console.log('LOG_REDACT_KEYS parse error, using defaults:', error)
    return ['token', 'authorization', 'email', 'phone']
  }
})()

function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    // Check if it looks like sensitive data
    const lower = obj.toLowerCase()
    if (REDACT_KEYS.some(key => lower.includes(key))) {
      return '[REDACTED]'
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData)
  }

  if (typeof obj === 'object') {
    const redacted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()
      if (REDACT_KEYS.some(redactKey => lowerKey.includes(redactKey))) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactSensitiveData(value)
      }
    }
    return redacted
  }

  return obj
}

export async function logAudit(
  operation: string,
  fields: Partial<AuditFields>
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const auditEntry = {
      provider: fields.provider || 'beds24',
      operation,
      hotel_id: fields.hotel_id,
      external_id: fields.external_id,
      status: fields.status,
      request_cost: fields.request_cost || 0,
      limit_remaining: fields.credit_limit_remaining,
      limit_resets_in: fields.credit_limit_resets_in,
      duration_ms: fields.duration_ms,
      request_payload: fields.request_payload ? redactSensitiveData(fields.request_payload) : null,
      response_payload: fields.response_payload ? redactSensitiveData(fields.response_payload) : null,
      error_message: fields.error_details ? JSON.stringify(redactSensitiveData(fields.error_details)) : null,
    }

    const { error } = await supabase
      .from('ingestion_audit')
      .insert(auditEntry)

    if (error) {
      console.error('Failed to log audit entry:', error)
    }
  } catch (err) {
    console.error('Error logging audit entry:', err)
  }
}

export function createOperationTimer() {
  const start = Date.now()
  return {
    getDuration: () => Date.now() - start
  }
}