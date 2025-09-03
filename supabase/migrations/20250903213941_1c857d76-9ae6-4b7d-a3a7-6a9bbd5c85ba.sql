-- Phase 1: Create service-owned tables for Beds24 integration
-- These tables don't need RLS as they're service-managed

-- External IDs mapping table for entity relationships
CREATE TABLE public.external_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'beds24',
    entity_type TEXT NOT NULL, -- 'property', 'room_type', 'reservation', 'guest', 'invoice'
    otelciro_id UUID NOT NULL,
    external_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, entity_type, external_id),
    UNIQUE(provider, entity_type, otelciro_id)
);

-- Sync state tracking per hotel
CREATE TABLE public.sync_state (
    provider TEXT NOT NULL DEFAULT 'beds24',
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    last_bookings_modified_from TIMESTAMPTZ,
    last_calendar_start DATE,
    last_calendar_end DATE,
    bootstrap_completed BOOLEAN DEFAULT false,
    bootstrap_completed_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(provider, hotel_id)
);

-- Comprehensive audit log for all API operations
CREATE TABLE public.ingestion_audit (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'beds24',
    entity_type TEXT NOT NULL,
    external_id TEXT,
    action TEXT NOT NULL, -- 'bootstrap', 'sync', 'push'
    operation TEXT NOT NULL, -- 'get_properties', 'get_bookings', 'post_calendar', etc.
    status TEXT NOT NULL, -- 'success', 'error', 'partial'
    hotel_id UUID REFERENCES public.hotels(id),
    request_cost INTEGER DEFAULT 0,
    limit_remaining INTEGER,
    limit_resets_in INTEGER,
    duration_ms INTEGER,
    records_processed INTEGER DEFAULT 0,
    request_payload JSONB,
    response_payload JSONB, -- PII will be redacted
    error_message TEXT,
    trace_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Beds24 token storage (service-owned, encrypted)
CREATE TABLE public.beds24_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_type TEXT NOT NULL, -- 'read' or 'write'
    encrypted_token TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    properties_access TEXT[], -- propertyIds this token can access
    diagnostics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_external_ids_lookup ON public.external_ids(provider, entity_type, external_id);
CREATE INDEX idx_external_ids_reverse ON public.external_ids(provider, entity_type, otelciro_id);
CREATE INDEX idx_sync_state_hotel ON public.sync_state(hotel_id);
CREATE INDEX idx_ingestion_audit_hotel_time ON public.ingestion_audit(hotel_id, created_at DESC);
CREATE INDEX idx_ingestion_audit_trace ON public.ingestion_audit(trace_id);
CREATE INDEX idx_ingestion_audit_status ON public.ingestion_audit(provider, status, created_at DESC);

-- Update trigger for sync_state
CREATE TRIGGER update_sync_state_updated_at
    BEFORE UPDATE ON public.sync_state
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for external_ids
CREATE TRIGGER update_external_ids_updated_at
    BEFORE UPDATE ON public.external_ids
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();