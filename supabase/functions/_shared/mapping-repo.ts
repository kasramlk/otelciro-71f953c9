import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

export async function resolveExternal(
  provider: string,
  entity: string,
  externalId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('v_external_ids')
      .select('otelciro_id')
      .eq('provider', provider)
      .eq('entity', entity)
      .eq('external_id', externalId)
      .single()

    if (error) {
      console.error('Error resolving external ID:', error)
      return null
    }

    return data?.otelciro_id || null
  } catch (error) {
    console.error('Error in resolveExternal:', error)
    return null
  }
}

export async function ensureMapping(
  provider: string,
  entity: string,
  externalId: string,
  otelciroId: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('external_ids')
      .upsert({
        provider,
        entity_type: entity,
        external_id: externalId,
        otelciro_id: otelciroId,
        metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'provider,entity_type,external_id'
      })

    if (error) {
      console.error('Error ensuring mapping:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in ensureMapping:', error)
    throw error
  }
}

export async function reverseLookup(
  provider: string,
  entity: string,
  otelciroId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('v_external_ids')
      .select('external_id')
      .eq('provider', provider)
      .eq('entity', entity)
      .eq('otelciro_id', otelciroId)
      .single()

    if (error) {
      console.error('Error in reverse lookup:', error)
      return null
    }

    return data?.external_id || null
  } catch (error) {
    console.error('Error in reverseLookup:', error)
    return null
  }
}

export async function getMappings(
  provider: string,
  entity: string,
  otelciroIds: string[]
): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('v_external_ids')
      .select('otelciro_id, external_id')
      .eq('provider', provider)
      .eq('entity', entity)
      .in('otelciro_id', otelciroIds)

    if (error) {
      console.error('Error getting mappings:', error)
      return {}
    }

    const mappings: Record<string, string> = {}
    data?.forEach(item => {
      mappings[item.otelciro_id] = item.external_id
    })

    return mappings
  } catch (error) {
    console.error('Error in getMappings:', error)
    return {}
  }
}