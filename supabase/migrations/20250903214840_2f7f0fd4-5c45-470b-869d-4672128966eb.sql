-- Phase 2: Add cron scheduling and rate push tracking

-- Create scheduled jobs tracking table
CREATE TABLE public.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL, -- 'booking_sync', 'calendar_sync', 'health_check'
    schedule_cron TEXT NOT NULL, -- '0 * * * *' for hourly
    is_enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT, -- 'success', 'error', 'running'
    last_run_duration_ms INTEGER,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rate push history table
CREATE TABLE public.rate_push_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    updates_pushed JSONB NOT NULL, -- What was updated (rate, availability, etc.)
    beds24_response JSONB, -- API response from Beds24
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'partial', 'error'
    lines_total INTEGER DEFAULT 0,
    lines_successful INTEGER DEFAULT 0,
    error_message TEXT,
    pushed_by UUID, -- User who triggered the push
    trace_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_scheduled_jobs_enabled ON public.scheduled_jobs(is_enabled, next_run_at);
CREATE INDEX idx_rate_push_history_hotel_date ON public.rate_push_history(hotel_id, date_range_start DESC, created_at DESC);
CREATE INDEX idx_rate_push_history_trace ON public.rate_push_history(trace_id);

-- Update triggers
CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON public.scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sync jobs
INSERT INTO public.scheduled_jobs (job_name, job_type, schedule_cron, settings) VALUES
('Hourly Booking Sync', 'booking_sync', '0 * * * *', '{"description": "Sync booking changes from Beds24 every hour"}'),
('6-Hour Calendar Sync', 'calendar_sync', '0 */6 * * *', '{"description": "Sync rates and availability every 6 hours"}'),
('Daily Health Check', 'health_check', '0 8 * * *', '{"description": "Check system health and send alerts daily at 8 AM"}');

-- Function to calculate next run time based on cron
CREATE OR REPLACE FUNCTION public.calculate_next_run(cron_expression TEXT, from_time TIMESTAMPTZ DEFAULT now())
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- Simple cron parsing for common patterns
    -- This is a basic implementation - in production you'd use a proper cron library
    
    IF cron_expression = '0 * * * *' THEN
        -- Every hour at minute 0
        next_run := date_trunc('hour', from_time) + INTERVAL '1 hour';
    ELSIF cron_expression = '0 */6 * * *' THEN
        -- Every 6 hours at minute 0
        next_run := date_trunc('hour', from_time) + 
                   INTERVAL '6 hours' * CEIL(EXTRACT(hour FROM from_time)::float / 6.0);
    ELSIF cron_expression = '0 8 * * *' THEN
        -- Daily at 8 AM
        next_run := date_trunc('day', from_time) + INTERVAL '1 day' + INTERVAL '8 hours';
        IF next_run <= from_time THEN
            next_run := next_run + INTERVAL '1 day';
        END IF;
    ELSE
        -- Default to 1 hour for unknown patterns
        next_run := from_time + INTERVAL '1 hour';
    END IF;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql STABLE;