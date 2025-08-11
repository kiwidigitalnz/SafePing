import { supabase } from '../supabase'

export interface Incident {
  id: string
  organization_id: string
  user_id: string
  title: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'false_alarm'
  assigned_to: string | null
  resolved_at: string | null
  metadata: any
  created_at: string
  updated_at: string
  user?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
  assigned_user?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
}

/**
 * Get active incidents for an organization
 */
export async function getActiveIncidents(organizationId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
    .eq('organization_id', organizationId)
    .in('status', ['open', 'investigating'])
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch active incidents: ${error.message}`)
  }

  return data || []
}

/**
 * Get all incidents for an organization
 */
export async function getIncidents(
  organizationId: string,
  options?: {
    status?: string
    severity?: string
    limit?: number
  }
): Promise<Incident[]> {
  let query = supabase
    .from('incidents')
    .select(`
      *,
      user:users!incidents_user_id_fkey(id, first_name, last_name, email, phone),
      assigned_user:users!incidents_assigned_to_fkey(id, first_name, last_name, email)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch incidents: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new incident
 */
export async function createIncident(incidentData: {
  organization_id: string
  user_id: string
  title: string
  description?: string | null
  severity?: 'low' | 'medium' | 'high' | 'critical'
  assigned_to?: string | null
  metadata?: any
}): Promise<Incident> {
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
    .single()

  if (error) {
    throw new Error(`Failed to create incident: ${error.message}`)
  }

  return data
}

/**
 * Update an incident
 */
export async function updateIncident(
  id: string,
  updates: {
    title?: string
    description?: string | null
    severity?: 'low' | 'medium' | 'high' | 'critical'
    status?: 'open' | 'investigating' | 'resolved' | 'false_alarm'
    assigned_to?: string | null
    metadata?: any
  }
): Promise<Incident> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  // Set resolved_at if status is being changed to resolved
  if (updates.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
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
    .single()

  if (error) {
    throw new Error(`Failed to update incident: ${error.message}`)
  }

  return data
}

/**
 * Delete an incident
 */
export async function deleteIncident(id: string): Promise<void> {
  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete incident: ${error.message}`)
  }
}

/**
 * Get incident statistics
 */
export async function getIncidentStats(organizationId: string): Promise<{
  total: number
  open: number
  investigating: number
  resolved: number
  false_alarm: number
  by_severity: {
    low: number
    medium: number
    high: number
    critical: number
  }
}> {
  const { data, error } = await supabase
    .from('incidents')
    .select('status, severity')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to fetch incident stats: ${error.message}`)
  }

  const incidents = data || []

  const stats = incidents.reduce(
    (acc, incident) => {
      acc.total++
      acc[incident.status as keyof Omit<typeof acc, 'total' | 'by_severity'>]++
      acc.by_severity[incident.severity as keyof typeof acc.by_severity]++
      return acc
    },
    {
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
    }
  )

  return stats
}