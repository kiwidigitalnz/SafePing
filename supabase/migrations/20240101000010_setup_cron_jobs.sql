-- Enable pg_cron extension for automated job scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions for cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to process overdue check-ins via HTTP function call
CREATE OR REPLACE FUNCTION process_overdue_checkins_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    response_status INTEGER;
    response_body TEXT;
    function_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Get the Supabase URL and service role key from environment
    SELECT current_setting('app.supabase_url', true) INTO function_url;
    SELECT current_setting('app.supabase_service_role_key', true) INTO service_role_key;
    
    -- Construct the Edge Function URL
    function_url := function_url || '/functions/v1/process-overdue-checkins';
    
    -- Call the Edge Function using HTTP
    SELECT status, content INTO response_status, response_body
    FROM http((
        'POST',
        function_url,
        ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
    ));
    
    -- Log the response
    INSERT INTO cron_job_logs (job_name, status, response_body, executed_at)
    VALUES ('process_overdue_checkins', response_status, response_body, NOW());
    
    -- Raise notice for debugging
    RAISE NOTICE 'Overdue check-ins processed. Status: %, Response: %', response_status, response_body;
    
EXCEPTION WHEN others THEN
    -- Log any errors
    INSERT INTO cron_job_logs (job_name, status, error_message, executed_at)
    VALUES ('process_overdue_checkins', 500, SQLERRM, NOW());
    
    RAISE NOTICE 'Error processing overdue check-ins: %', SQLERRM;
END;
$$;

-- Create a table to log cron job executions
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    status INTEGER,
    response_body TEXT,
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for cron job logs
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage cron job logs" ON cron_job_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at ON cron_job_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON cron_job_logs(job_name);

-- Schedule the cron job to run every 5 minutes
-- This will check for overdue check-ins every 5 minutes during business hours
SELECT cron.schedule(
    'process-overdue-checkins',           -- job name
    '*/5 * * * *',                        -- every 5 minutes
    'SELECT process_overdue_checkins_cron();'
);

-- Create a function to manually trigger overdue processing (for testing)
CREATE OR REPLACE FUNCTION trigger_overdue_processing()
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    executed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Call the cron function
    PERFORM process_overdue_checkins_cron();
    
    RETURN QUERY SELECT 
        true as success,
        'Overdue processing triggered successfully' as message,
        NOW() as executed_at;
        
EXCEPTION WHEN others THEN
    RETURN QUERY SELECT 
        false as success,
        SQLERRM as message,
        NOW() as executed_at;
END;
$$;

-- Create a function to get cron job status and logs
CREATE OR REPLACE FUNCTION get_cron_job_status(job_name_filter TEXT DEFAULT NULL)
RETURNS TABLE(
    job_name TEXT,
    last_execution TIMESTAMPTZ,
    last_status INTEGER,
    last_response TEXT,
    last_error TEXT,
    execution_count BIGINT,
    success_count BIGINT,
    error_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.job_name,
        MAX(l.executed_at) as last_execution,
        (SELECT status FROM cron_job_logs l2 WHERE l2.job_name = l.job_name ORDER BY executed_at DESC LIMIT 1) as last_status,
        (SELECT response_body FROM cron_job_logs l2 WHERE l2.job_name = l.job_name ORDER BY executed_at DESC LIMIT 1) as last_response,
        (SELECT error_message FROM cron_job_logs l2 WHERE l2.job_name = l.job_name ORDER BY executed_at DESC LIMIT 1) as last_error,
        COUNT(*) as execution_count,
        COUNT(*) FILTER (WHERE status >= 200 AND status < 300) as success_count,
        COUNT(*) FILTER (WHERE status < 200 OR status >= 300 OR error_message IS NOT NULL) as error_count
    FROM cron_job_logs l
    WHERE (job_name_filter IS NULL OR l.job_name = job_name_filter)
    GROUP BY l.job_name
    ORDER BY last_execution DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_overdue_checkins_cron() TO postgres;
GRANT EXECUTE ON FUNCTION trigger_overdue_processing() TO postgres;
GRANT EXECUTE ON FUNCTION get_cron_job_status(TEXT) TO postgres;

-- Insert initial log entry
INSERT INTO cron_job_logs (job_name, status, response_body, executed_at)
VALUES ('system', 200, 'Cron job system initialized successfully', NOW());

COMMENT ON TABLE cron_job_logs IS 'Logs for automated cron job executions';
COMMENT ON FUNCTION process_overdue_checkins_cron() IS 'Calls the process-overdue-checkins Edge Function via HTTP';
COMMENT ON FUNCTION trigger_overdue_processing() IS 'Manually trigger overdue check-in processing for testing';
COMMENT ON FUNCTION get_cron_job_status(TEXT) IS 'Get status and statistics for cron jobs';