-- Migration 020: Fix Leads Race Condition
-- Objetivo: Garantir que o incremento de total_events seja atômico e thread-safe.

CREATE OR REPLACE FUNCTION public.upsert_lead_profile_atomic(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_lead_score INTEGER,
    p_behavior_tags TEXT[],
    p_product_history JSONB,
    p_last_event_type TEXT,
    p_potential_value NUMERIC,
    p_converted_value NUMERIC,
    p_service_status TEXT,
    p_lead_summary TEXT,
    p_last_platform TEXT
)
RETURNS public.leads_profiles AS $$
DECLARE
    v_profile public.leads_profiles;
BEGIN
    INSERT INTO public.leads_profiles (
        user_id, email, name, phone, 
        total_events, lead_score, behavior_tags, product_history,
        last_event_type, potential_value, converted_value, 
        service_status, lead_summary, last_platform,
        last_interaction_at, updated_at
    )
    VALUES (
        p_user_id, p_email, p_name, p_phone,
        1, p_lead_score, p_behavior_tags, p_product_history,
        p_last_event_type, p_potential_value, p_converted_value,
        p_service_status, p_lead_summary, p_last_platform,
        NOW(), NOW()
    )
    ON CONFLICT (user_id, email) DO UPDATE SET
        name = COALESCE(excluded.name, leads_profiles.name),
        phone = COALESCE(excluded.phone, leads_profiles.phone),
        total_events = leads_profiles.total_events + 1, -- INCREMENTO ATÔMICO
        lead_score = excluded.lead_score,
        behavior_tags = excluded.behavior_tags,
        product_history = excluded.product_history,
        last_event_type = excluded.last_event_type,
        potential_value = excluded.potential_value,
        converted_value = excluded.converted_value,
        service_status = excluded.service_status,
        lead_summary = COALESCE(excluded.lead_summary, leads_profiles.lead_summary),
        last_platform = excluded.last_platform,
        last_interaction_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to service_role and authenticated users (as needed)
GRANT EXECUTE ON FUNCTION public.upsert_lead_profile_atomic TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_lead_profile_atomic TO authenticated;
