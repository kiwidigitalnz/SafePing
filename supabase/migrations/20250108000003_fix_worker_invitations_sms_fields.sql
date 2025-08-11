-- Add missing SMS tracking fields to worker_invitations table
ALTER TABLE public.worker_invitations 
ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT,
ADD COLUMN IF NOT EXISTS sms_message_id TEXT;

-- Add index for SMS message ID for tracking
CREATE INDEX IF NOT EXISTS idx_worker_invitations_sms_message_id 
ON public.worker_invitations(sms_message_id) 
WHERE sms_message_id IS NOT NULL;

-- Update the status check constraint to include more SMS-related statuses
ALTER TABLE public.worker_invitations 
DROP CONSTRAINT IF EXISTS worker_invitations_status_check;

ALTER TABLE public.worker_invitations 
ADD CONSTRAINT worker_invitations_status_check 
CHECK (status IN ('pending', 'sent', 'clicked', 'verified', 'completed', 'expired', 'failed'));

-- Add comment for new fields
COMMENT ON COLUMN public.worker_invitations.sms_delivery_status IS 'SMS delivery status from provider (sent, delivered, failed, etc.)';
COMMENT ON COLUMN public.worker_invitations.sms_message_id IS 'Message ID from SMS provider for tracking';
