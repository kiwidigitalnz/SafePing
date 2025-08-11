-- Migration: Worker Authentication System
-- Description: Updates to support biometric, PIN, and OTP-only authentication for workers

-- Add new columns to users table for worker authentication
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_device_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- Create worker_sessions table for persistent sessions
CREATE TABLE IF NOT EXISTS public.worker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.users(id),
  revoke_reason TEXT
);

-- Create worker_devices table for device management
CREATE TABLE IF NOT EXISTS public.worker_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  push_token TEXT,
  biometric_type TEXT, -- 'face_id', 'touch_id', 'fingerprint', etc.
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, device_id)
);

-- Create worker_invitations table for tracking invitations
CREATE TABLE IF NOT EXISTS public.worker_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  invitation_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  sms_sent_at TIMESTAMPTZ,
  sms_delivery_status TEXT,
  clicked_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  installed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'clicked', 'verified', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pin_verification_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.pin_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  ip_address INET
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_sessions_user_id ON public.worker_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_device_id ON public.worker_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_token ON public.worker_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_worker_devices_user_id ON public.worker_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_devices_device_id ON public.worker_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_worker_invitations_token ON public.worker_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_worker_invitations_user_id ON public.worker_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_user_id ON public.pin_verification_attempts(user_id);

-- Function to verify PIN with rate limiting
CREATE OR REPLACE FUNCTION verify_worker_pin(
  p_user_id UUID,
  p_pin_hash TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
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
    
    -- Reset attempts counter
    UPDATE public.users 
    SET pin_attempts = 0, pin_locked_until = NULL
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object('success', true);
  ELSE
    -- Record failed attempt
    INSERT INTO public.pin_verification_attempts (user_id, device_id, success)
    VALUES (p_user_id, p_device_id, false);
    
    -- Increment attempts counter
    UPDATE public.users 
    SET pin_attempts = pin_attempts + 1
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid PIN',
      'attempts_remaining', 5 - v_attempts - 1
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create worker session
CREATE OR REPLACE FUNCTION create_worker_session(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_session_token TEXT;
  v_refresh_token TEXT;
  v_session_id UUID;
BEGIN
  -- Generate tokens
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_refresh_token := encode(gen_random_bytes(32), 'hex');
  
  -- Deactivate existing sessions for this device
  UPDATE public.worker_sessions 
  SET is_active = false, revoked_at = NOW(), revoke_reason = 'New session created'
  WHERE user_id = p_user_id AND device_id = p_device_id AND is_active = true;
  
  -- Create new session
  INSERT INTO public.worker_sessions (
    user_id, 
    device_id, 
    device_name,
    device_type,
    session_token, 
    refresh_token,
    user_agent,
    expires_at
  ) VALUES (
    p_user_id,
    p_device_id,
    p_device_info->>'device_name',
    p_device_info->>'device_type',
    v_session_token,
    v_refresh_token,
    p_device_info->>'user_agent',
    NOW() + INTERVAL '1 year' -- Long-lived sessions for workers
  ) RETURNING id INTO v_session_id;
  
  -- Update or insert device record
  INSERT INTO public.worker_devices (
    user_id,
    device_id,
    device_name,
    device_type,
    device_model,
    os_version,
    app_version,
    biometric_type
  ) VALUES (
    p_user_id,
    p_device_id,
    p_device_info->>'device_name',
    p_device_info->>'device_type',
    p_device_info->>'device_model',
    p_device_info->>'os_version',
    p_device_info->>'app_version',
    p_device_info->>'biometric_type'
  )
  ON CONFLICT (user_id, device_id) 
  DO UPDATE SET
    last_seen_at = NOW(),
    device_name = EXCLUDED.device_name,
    device_type = EXCLUDED.device_type,
    device_model = EXCLUDED.device_model,
    os_version = EXCLUDED.os_version,
    app_version = EXCLUDED.app_version,
    biometric_type = EXCLUDED.biometric_type;
  
  -- Update user's last device
  UPDATE public.users 
  SET last_device_id = p_device_id
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'session_token', v_session_token,
    'refresh_token', v_refresh_token,
    'expires_at', NOW() + INTERVAL '1 year'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate worker session
CREATE OR REPLACE FUNCTION validate_worker_session(
  p_session_token TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
BEGIN
  -- Get session details
  SELECT s.*, u.* 
  INTO v_session
  FROM public.worker_sessions s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.session_token = p_session_token
    AND s.is_active = true
    AND (s.expires_at IS NULL OR s.expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired session');
  END IF;
  
  -- Check device ID if provided
  IF p_device_id IS NOT NULL AND v_session.device_id != p_device_id THEN
    -- Device changed, require re-authentication
    UPDATE public.worker_sessions 
    SET is_active = false, revoked_at = NOW(), revoke_reason = 'Device change detected'
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object('valid', false, 'error', 'Device change detected', 'require_reauth', true);
  END IF;
  
  -- Update last active timestamp
  UPDATE public.worker_sessions 
  SET last_active_at = NOW()
  WHERE id = v_session.id;
  
  -- Update device last seen
  IF p_device_id IS NOT NULL THEN
    UPDATE public.worker_devices 
    SET last_seen_at = NOW()
    WHERE user_id = v_session.user_id AND device_id = p_device_id;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_session.user_id,
    'session_id', v_session.id,
    'device_id', v_session.device_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.worker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Worker sessions policies
CREATE POLICY "Users can view their own sessions" ON public.worker_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all sessions" ON public.worker_sessions
  FOR ALL USING (true);

-- Worker devices policies  
CREATE POLICY "Users can view their own devices" ON public.worker_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all devices" ON public.worker_devices
  FOR ALL USING (true);

-- Worker invitations policies
CREATE POLICY "Admins can view organization invitations" ON public.worker_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND organization_id = worker_invitations.organization_id
      AND role IN ('org_admin', 'admin')
    )
  );

CREATE POLICY "System can manage all invitations" ON public.worker_invitations
  FOR ALL USING (true);

-- PIN verification attempts policies
CREATE POLICY "Users can view their own attempts" ON public.pin_verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all attempts" ON public.pin_verification_attempts
  FOR ALL USING (true);
