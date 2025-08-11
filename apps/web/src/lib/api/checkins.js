import { supabase } from '../supabase';
// Create a new check-in
export async function createCheckIn(data) {
    const { data: result, error } = await supabase
        .from('check_ins')
        .insert({
        ...data,
        organization_id: await getCurrentUserOrgId(),
    })
        .select()
        .single();
    if (error)
        throw error;
    return result;
}
// Get recent check-ins for an organization (for realtime dashboard)
export async function getRecentCheckIns(organizationId, limit = 20) {
    const { data, error } = await supabase
        .from('check_ins')
        .select(`
      *,
      user:users(id, first_name, last_name, email, phone)
    `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return data || [];
}
// Get check-ins for organization with optional filters
export async function getCheckIns(options) {
    let query = supabase
        .from('check_ins')
        .select(`
      *,
      users:user_id (
        first_name,
        last_name,
        profile_image_url,
        employee_id
      )
    `)
        .eq('organization_id', await getCurrentUserOrgId())
        .order('created_at', { ascending: false });
    if (options?.userId) {
        query = query.eq('user_id', options.userId);
    }
    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.startDate) {
        query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
        query = query.lte('created_at', options.endDate);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 50) - 1);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data;
}
// Get latest check-in for each user
export async function getLatestCheckIns() {
    const { data, error } = await supabase
        .rpc('get_latest_checkins', {
        org_id: await getCurrentUserOrgId()
    });
    if (error)
        throw error;
    return data;
}
// Get check-in statistics
export async function getCheckInStats(timeRange) {
    const orgId = await getCurrentUserOrgId();
    let query = supabase
        .from('check_ins')
        .select('status, created_at')
        .eq('organization_id', orgId);
    if (timeRange) {
        query = query
            .gte('created_at', timeRange.startDate)
            .lte('created_at', timeRange.endDate);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    // Calculate statistics
    const stats = {
        total: data.length,
        safe: data.filter(c => c.status === 'safe').length,
        overdue: data.filter(c => c.status === 'overdue').length,
        missed: data.filter(c => c.status === 'missed').length,
        emergency: data.filter(c => c.status === 'emergency').length,
    };
    return {
        ...stats,
        onTimeRate: stats.total > 0 ? ((stats.safe / stats.total) * 100).toFixed(1) : '0',
    };
}
// Update check-in status
export async function updateCheckInStatus(id, status) {
    const { data, error } = await supabase
        .from('check_ins')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// Acknowledge/resolve a check-in alert
export async function acknowledgeCheckIn(id, acknowledgedBy, notes) {
    const { data, error } = await supabase
        .from('check_ins')
        .update({
        metadata: {
            acknowledged_by: acknowledgedBy,
            acknowledged_at: new Date().toISOString(),
            acknowledgment_notes: notes,
        }
    })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// Get overdue check-ins
export async function getOverdueCheckIns() {
    const { data, error } = await supabase
        .rpc('get_overdue_checkins', {
        org_id: await getCurrentUserOrgId()
    });
    if (error)
        throw error;
    return data;
}
// Helper function to get current user's organization ID
async function getCurrentUserOrgId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        throw new Error('Not authenticated');
    const { data: userData, error } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    if (error)
        throw error;
    if (!userData?.organization_id)
        throw new Error('User not associated with organization');
    return userData.organization_id;
}
// Subscribe to real-time check-in updates
export function subscribeToCheckIns(organizationId, onUpdate) {
    const channel = supabase
        .channel(`checkins-${organizationId}`)
        .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins',
        filter: `organization_id=eq.${organizationId}`,
    }, onUpdate)
        .subscribe();
    return () => {
        supabase.removeChannel(channel);
    };
}
