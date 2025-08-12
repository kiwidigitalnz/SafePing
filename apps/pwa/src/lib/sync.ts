import { supabase } from './supabase'
import { offlineStore } from './offline'

export async function syncPendingCheckIns(): Promise<void> {
  const pendingCheckIns = await offlineStore.getPendingCheckIns()
  
  if (pendingCheckIns.length === 0) {
    return
  }

  console.log(`Syncing ${pendingCheckIns.length} pending check-ins`)

  for (const checkIn of pendingCheckIns) {
    try {
      const { localId, ...checkInData } = checkIn
      
      const { error } = await supabase
        .from('check_ins')
        .upsert(checkInData)
        .select()
        .single()

      if (error) {
        console.error('Failed to sync check-in:', error)
        continue
      }

      // Remove from pending after successful sync
      await offlineStore.removePendingCheckIn(checkIn.id)
    } catch (error) {
      console.error('Error syncing check-in:', error)
    }
  }
}