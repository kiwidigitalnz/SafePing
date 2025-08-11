-- Check-in related functions and triggers

-- Function to get latest check-in for each user in an organization
CREATE OR REPLACE FUNCTION get_latest_checkins(org_id UUID)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    user_id UUID,
    status checkin_status,
    location_lat DECIMAL,
    location_lng DECIMAL,
    location_accuracy DECIMAL,
    location_address TEXT,
    message TEXT,
    image_url TEXT,
    is_manual BOOLEAN,
    is_offline BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE,
    users JSONB
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH latest_checkins AS (
        SELECT DISTINCT ON (user_id) 
            c.*,
            ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM check_ins c
        WHERE c.organization_id = org_id
        ORDER BY user_id, created_at DESC
    )
    SELECT 
        lc.id,
        lc.organization_id,
        lc.user_id,
        lc.status,
        lc.location_lat,
        lc.location_lng,
        lc.location_accuracy,
        lc.location_address,
        lc.message,
        lc.image_url,
        lc.is_manual,
        lc.is_offline,
        lc.metadata,
        lc.created_at,
        lc.synced_at,
        jsonb_build_object(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_image_url', u.profile_image_url,
            'employee_id', u.employee_id
        ) as users
    FROM latest_checkins lc
    JOIN users u ON u.id = lc.user_id
    WHERE lc.rn = 1
    ORDER BY lc.created_at DESC;
$$;

-- Function to get overdue check-ins based on schedules
CREATE OR REPLACE FUNCTION get_overdue_checkins(org_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    last_checkin TIMESTAMP WITH TIME ZONE,
    overdue_minutes INTEGER,
    schedule_name TEXT,
    phone TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH user_schedules AS (
        SELECT 
            sa.user_id,
            s.name as schedule_name,
            s.check_in_interval_minutes,
            s.grace_period_minutes
        FROM schedule_assignments sa
        JOIN schedules s ON s.id = sa.schedule_id
        WHERE sa.organization_id = org_id
          AND sa.is_active = true
          AND s.is_active = true
    ),
    latest_checkins AS (
        SELECT DISTINCT ON (user_id)
            user_id,
            created_at as last_checkin
        FROM check_ins
        WHERE organization_id = org_id
        ORDER BY user_id, created_at DESC
    )
    SELECT 
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        COALESCE(lc.last_checkin, u.created_at) as last_checkin,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(lc.last_checkin, u.created_at)))/60 as overdue_minutes,
        us.schedule_name,
        u.phone
    FROM users u
    LEFT JOIN user_schedules us ON us.user_id = u.id
    LEFT JOIN latest_checkins lc ON lc.user_id = u.id
    WHERE u.organization_id = org_id
      AND u.role = 'worker'
      AND u.is_active = true
      AND us.user_id IS NOT NULL
      AND EXTRACT(EPOCH FROM (NOW() - COALESCE(lc.last_checkin, u.created_at)))/60 > 
          (us.check_in_interval_minutes + COALESCE(us.grace_period_minutes, 0))
    ORDER BY overdue_minutes DESC;
$$;

-- Function to automatically update check-in status based on time
CREATE OR REPLACE FUNCTION update_checkin_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    checkin_record RECORD;
BEGIN
    -- Update overdue check-ins
    FOR checkin_record IN 
        SELECT c.id, c.user_id, c.created_at, s.check_in_interval_minutes, s.grace_period_minutes
        FROM check_ins c
        JOIN users u ON u.id = c.user_id
        JOIN schedule_assignments sa ON sa.user_id = u.id AND sa.is_active = true
        JOIN schedules s ON s.id = sa.schedule_id AND s.is_active = true
        WHERE c.status = 'safe'
          AND EXTRACT(EPOCH FROM (NOW() - c.created_at))/60 > s.check_in_interval_minutes
    LOOP
        -- Check if within grace period
        IF EXTRACT(EPOCH FROM (NOW() - checkin_record.created_at))/60 <= 
           (checkin_record.check_in_interval_minutes + COALESCE(checkin_record.grace_period_minutes, 0)) THEN
            UPDATE check_ins 
            SET status = 'overdue', updated_at = NOW()
            WHERE id = checkin_record.id;
        ELSE
            UPDATE check_ins 
            SET status = 'missed', updated_at = NOW()
            WHERE id = checkin_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Function to calculate next check-in due time for a user
CREATE OR REPLACE FUNCTION get_next_checkin_due(user_uuid UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH user_schedule AS (
        SELECT s.check_in_interval_minutes
        FROM schedule_assignments sa
        JOIN schedules s ON s.id = sa.schedule_id
        WHERE sa.user_id = user_uuid
          AND sa.is_active = true
          AND s.is_active = true
        LIMIT 1
    ),
    last_checkin AS (
        SELECT created_at
        FROM check_ins
        WHERE user_id = user_uuid
        ORDER BY created_at DESC
        LIMIT 1
    )
    SELECT 
        CASE 
            WHEN lc.created_at IS NOT NULL THEN 
                lc.created_at + (us.check_in_interval_minutes || ' minutes')::INTERVAL
            ELSE 
                NOW() + (us.check_in_interval_minutes || ' minutes')::INTERVAL
        END
    FROM user_schedule us
    LEFT JOIN last_checkin lc ON true;
$$;

-- Trigger function to update user's last_seen_at when they check in
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users 
    SET last_seen_at = NEW.created_at
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for updating last_seen_at
DROP TRIGGER IF EXISTS trigger_update_user_last_seen ON check_ins;
CREATE TRIGGER trigger_update_user_last_seen
    AFTER INSERT ON check_ins
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_seen();

-- Function to create audit log entry for check-ins
CREATE OR REPLACE FUNCTION log_checkin_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        new_values,
        created_at
    ) VALUES (
        NEW.organization_id,
        NEW.user_id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'check_in.created'
            WHEN TG_OP = 'UPDATE' THEN 'check_in.updated'
        END,
        'check_in',
        NEW.id,
        to_jsonb(NEW),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create audit trigger for check-ins
DROP TRIGGER IF EXISTS trigger_checkin_audit ON check_ins;
CREATE TRIGGER trigger_checkin_audit
    AFTER INSERT OR UPDATE ON check_ins
    FOR EACH ROW
    EXECUTE FUNCTION log_checkin_audit();

-- Function to get check-in statistics for dashboard
CREATE OR REPLACE FUNCTION get_checkin_dashboard_stats(org_id UUID, time_range_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    total_workers INTEGER,
    active_workers INTEGER,
    safe_checkins INTEGER,
    overdue_checkins INTEGER,
    missed_checkins INTEGER,
    emergency_checkins INTEGER,
    on_time_rate DECIMAL
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH time_filter AS (
        SELECT NOW() - (time_range_hours || ' hours')::INTERVAL as start_time
    ),
    worker_count AS (
        SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active
        FROM users
        WHERE organization_id = org_id AND role = 'worker'
    ),
    checkin_stats AS (
        SELECT 
            COUNT(*) as total_checkins,
            COUNT(CASE WHEN status = 'safe' THEN 1 END) as safe,
            COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
            COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
            COUNT(CASE WHEN status = 'emergency' THEN 1 END) as emergency
        FROM check_ins c
        CROSS JOIN time_filter tf
        WHERE c.organization_id = org_id
          AND c.created_at >= tf.start_time
    )
    SELECT 
        wc.total::INTEGER,
        wc.active::INTEGER,
        cs.safe::INTEGER,
        cs.overdue::INTEGER,
        cs.missed::INTEGER,
        cs.emergency::INTEGER,
        CASE 
            WHEN cs.total_checkins > 0 THEN 
                ROUND((cs.safe::DECIMAL / cs.total_checkins::DECIMAL) * 100, 2)
            ELSE 0
        END as on_time_rate
    FROM worker_count wc
    CROSS JOIN checkin_stats cs;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_checkins(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_overdue_checkins(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_checkin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_checkin_due(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_checkin_dashboard_stats(UUID, INTEGER) TO authenticated;