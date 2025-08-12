-- Migration: Add PIN reset functionality and activity tracking
-- Description: Allow admins to reset worker PINs and track last login/activity times

-- Add last_login_at column to track when users log into the PWA
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add last_activity_at column to track last activity in the PWA
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add pin_reset_required flag to force PIN reset on next login
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_reset_required BOOLEAN DEFAULT false;

-- Add pin_reset_by to track who reset the PIN
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_reset_by UUID REFERENCES public.users(id);

-- Add pin_reset_at to track when PIN was reset
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_reset_at TIMESTAMPTZ;

-- Update pin_hash to allow 4-6 digit PINs (already supports any length)
-- No change needed as pin_hash is TEXT type

-- Create function to reset worker PIN
CREATE OR REPLACE FUNCTION reset_worker_pin(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_admin RECORD;
BEGIN
  -- Check if admin exists and has permission
  SELECT * INTO v_admin FROM public.users WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;
  
  -- Check if admin has permission (must be admin, org_admin, or super_admin)
  IF v_admin.role NOT IN ('admin', 'org_admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Check if target user exists
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if admin and user are in the same organization
  IF v_admin.organization_id != v_user.organization_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot reset PIN for user in different organization');
  END IF;
  
  -- Reset the PIN
  UPDATE public.users
  SET 
    pin_hash = NULL,
    pin_reset_required = true,
    pin_reset_by = p_admin_id,
    pin_reset_at = NOW(),
    pin_attempts = 0,
    pin_locked_until = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'PIN reset successfully. User will be prompted to set a new PIN on next login.'
  );
END;
$$;

-- Create function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_last_activity(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET last_activity_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Create function to update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    last_login_at = NOW(),
    last_activity_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Update verify_worker_pin function to support 4-6 digit PINs
CREATE OR REPLACE FUNCTION verify_worker_pin(
  p_user_id UUID,
  p_pin_hash TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_attempts INTEGER;
  v_result JSONB;
BEGIN
  -- Get user details
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if PIN reset is required
  IF v_user.pin_reset_required THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'PIN reset required',
      'pin_reset_required', true
    );
  END IF;
  
  -- Check if account is locked
  IF v_user.pin_locked_until IS NOT NULL AND v_user.pin_locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Account locked',
      'locked_until', v_user.pin_locked_until
    );
  END IF;
  
  -- Count recent failed attempts (last 15 minutes)
  SELECT COUNT(*) INTO v_attempts 
  FROM public.pin_verification_attempts
  WHERE user_id = p_user_id 
    AND attempted_at > NOW() - INTERVAL '15 minutes'
    AND success = false;
  
  -- Lock account if too many attempts
  IF v_attempts >= 5 THEN
    UPDATE public.users 
    SET pin_locked_until = NOW() + INTERVAL '30 minutes'
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Too many attempts. Account locked for 30 minutes'
    );
  END IF;
  
  -- Verify PIN
  IF v_user.pin_hash = p_pin_hash THEN
    -- Record successful attempt
    INSERT INTO public.pin_verification_attempts (user_id, device_id, success)
    VALUES (p_user_id, p_device_id, true);
    
    -- Reset attempts counter and update last login
    UPDATE public.users 
    SET 
      pin_attempts = 0, 
      pin_locked_until = NULL,
      last_login_at = NOW(),
      last_activity_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object('success', true);
  ELSE
    -- Record failed attempt
    INSERT INTO public.pin_verification_attempts (user_id, device_id, success)
    VALUES (p_user_id, p_device_id, false);
    
    -- Increment attempts counter
    UPDATE public.users 
    SET pin_attempts = v_user.pin_attempts + 1
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid PIN',
      'attempts_remaining', 5 - v_attempts - 1
    );
  END IF;
END;
$$;

-- Add RLS policies for PIN reset
CREATE POLICY "Admins can reset PINs in their organization" ON public.users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE organization_id = users.organization_id 
      AND role IN ('admin', 'org_admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON public.users(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_users_pin_reset_required ON public.users(pin_reset_required) WHERE pin_reset_required = true;