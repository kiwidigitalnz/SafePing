import { supabase } from '../supabase';
/**
 * Get active incidents for an organization
 */
export async function getActiveIncidents(organizationId) {
    const { data, error } = await supabase
        .from('incidents')
        .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
        .eq('organization_id', organizationId)
        .in('status', ['open', 'investigating'])
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(`Failed to fetch active incidents: ${error.message}`);
    }
    return data || [];
}
/**
 * Get all incidents for an organization
 */
export async function getIncidents(organizationId, options) {
    let query = supabase
        .from('incidents')
        .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.severity) {
        query = query.eq('severity', options.severity);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch incidents: ${error.message}`);
    }
    return data || [];
}
/**
 * Create a new incident
 */
export async function createIncident(incidentData) {
    const { data, error } = await supabase
        .from('incidents')
        .insert({
        ...incidentData,
        severity: incidentData.severity ?? 'medium',
        status: 'open',
        metadata: incidentData.metadata ?? {}
    })
        .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
        .single();
    if (error) {
        throw new Error(`Failed to create incident: ${error.message}`);
    }
    return data;
}
/**
 * Update an incident
 */
export async function updateIncident(id, updates) {
    const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
    };
    // Set resolved_at if status is being changed to resolved
    if (updates.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    }
    const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id)
        .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
        .single();
    if (error) {
        throw new Error(`Failed to update incident: ${error.message}`);
    }
    return data;
}
/**
 * Delete an incident
 */
export async function deleteIncident(id) {
    const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(`Failed to delete incident: ${error.message}`);
    }
}
/**
 * Get incident statistics
 */
export async function getIncidentStats(organizationId) {
    const { data, error } = await supabase
        .from('incidents')
        .select('status, severity')
        .eq('organization_id', organizationId);
    if (error) {
        throw new Error(`Failed to fetch incident stats: ${error.message}`);
    }
    const incidents = data || [];
    const stats = incidents.reduce((acc, incident) => {
        acc.total++;
        acc[incident.status]++;
        acc.by_severity[incident.severity]++;
        return acc;
    }, {
        total: 0,
        open: 0,
        investigating: 0,
        resolved: 0,
        false_alarm: 0,
        by_severity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        }
    });
    return stats;
}
