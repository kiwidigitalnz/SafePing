import { supabase } from './supabase'
import type { Database } from './supabase'
import { offlineStore } from './offline'

type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']
type CheckInRow = Database['public']['Tables']['check_ins']['Row']

export async function submitCheckIn(checkIn: CheckInInsert): Promise<CheckInRow> {
  try {
    // Try to submit online first
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        ...checkIn,
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    
    return data
  } catch (error) {
    console.warn('Online check-in failed, storing offline:', error)
    
    // Store offline for later sync
    const offlineCheckIn: CheckInRow = {
      ...checkIn,
      id: crypto.randomUUID(),
      status: checkIn.status || 'safe',
      location_lat: checkIn.location_lat || null,
      location_lng: checkIn.location_lng || null,
      location_accuracy: checkIn.location_accuracy || null,
      location_address: checkIn.location_address || null,
      message: checkIn.message || null,
      image_url: checkIn.image_url || null,
      is_manual: checkIn.is_manual ?? true,
      is_offline: true,
      metadata: checkIn.metadata || {},
      created_at: new Date().toISOString(),
      synced_at: null
    }
    
    await offlineStore.addPendingCheckIn(offlineCheckIn)
    
    return offlineCheckIn
  }
}

export async function getCheckInHistory(userId: string, limit: number = 20): Promise<CheckInRow[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function syncPendingCheckIns(): Promise<void> {
  const pendingCheckIns = await offlineStore.getPendingCheckIns()
  
  for (const checkIn of pendingCheckIns) {
    try {
      const { error } = await supabase
        .from('check_ins')
        .insert({
          ...checkIn,
          synced_at: new Date().toISOString()
        })

      if (!error) {
        // Remove from offline storage after successful sync
        await offlineStore.removePendingCheckIn(checkIn.id)
      }
    } catch (error) {
      console.warn('Failed to sync check-in:', checkIn.id, error)
    }
  }
}