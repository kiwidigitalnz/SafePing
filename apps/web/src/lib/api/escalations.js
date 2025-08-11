import { supabase } from '../supabase';
/**
 * Get all escalation rules for an organization
 */
export async function getEscalationRules(organizationId) {
    const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('delay_minutes', { ascending: true });
    if (error) {
        throw new Error(`Failed to fetch escalation rules: ${error.message}`);
    }
    return data || [];
}
/**
 * Get escalation rules for a specific schedule
 */
export async function getScheduleEscalationRules(organizationId, scheduleId) {
    const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('schedule_id', scheduleId)
        .order('delay_minutes', { ascending: true });
    if (error) {
        throw new Error(`Failed to fetch schedule escalation rules: ${error.message}`);
    }
    return data || [];
}
/**
 * Get global escalation rules (apply to all schedules)
 */
export async function getGlobalEscalationRules(organizationId) {
    const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('organization_id', organizationId)
        .is('schedule_id', null)
        .order('delay_minutes', { ascending: true });
    if (error) {
        throw new Error(`Failed to fetch global escalation rules: ${error.message}`);
    }
    return data || [];
}
/**
 * Create a new escalation rule
 */
export async function createEscalationRule(data) {
    const { data: result, error } = await supabase
        .from('escalations')
        .insert({
        ...data,
        is_active: data.is_active ?? true,
    })
        .select()
        .single();
    if (error) {
        throw new Error(`Failed to create escalation rule: ${error.message}`);
    }
    return result;
}
/**
 * Update an escalation rule
 */
export async function updateEscalationRule(id, data) {
    const { data: result, error } = await supabase
        .from('escalations')
        .update({
        ...data,
        updated_at: new Date().toISOString(),
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new Error(`Failed to update escalation rule: ${error.message}`);
    }
    return result;
}
/**
 * Delete an escalation rule
 */
export async function deleteEscalationRule(id) {
    const { error } = await supabase
        .from('escalations')
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(`Failed to delete escalation rule: ${error.message}`);
    }
}
/**
 * Toggle escalation rule active status
 */
export async function toggleEscalationRule(id, isActive) {
    return updateEscalationRule(id, { is_active: isActive });
}
/**
 * Bulk update escalation rules
 */
export async function bulkUpdateEscalationRules(rules) {
    const updates = rules.map(({ id, data }) => supabase
        .from('escalations')
        .update({
        ...data,
        updated_at: new Date().toISOString(),
    })
        .eq('id', id)
        .select()
        .single());
    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} escalation rules`);
    }
    return results.map(result => result.data).filter(Boolean);
}
/**
 * Validate escalation rule data
 */
export function validateEscalationRule(data) {
    const errors = [];
    if (!data.organization_id) {
        errors.push('Organization ID is required');
    }
    if (!data.level) {
        errors.push('Escalation level is required');
    }
    if (data.delay_minutes === undefined || data.delay_minutes < 0) {
        errors.push('Delay minutes must be a positive number');
    }
    if (!data.contact_method) {
        errors.push('Contact method is required');
    }
    if (!data.contact_list || data.contact_list.length === 0) {
        errors.push('At least one contact is required');
    }
    // Validate contact list based on method
    if (data.contact_method === 'sms' || data.contact_method === 'call') {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        const invalidPhones = data.contact_list?.filter(contact => !phoneRegex.test(contact)) || [];
        if (invalidPhones.length > 0) {
            errors.push(`Invalid phone numbers: ${invalidPhones.join(', ')}`);
        }
    }
    if (data.contact_method === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = data.contact_list?.filter(contact => !emailRegex.test(contact)) || [];
        if (invalidEmails.length > 0) {
            errors.push(`Invalid email addresses: ${invalidEmails.join(', ')}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Get escalation level options
 */
export const ESCALATION_LEVELS = [
    {
        value: 'level_1',
        label: 'Level 1',
        description: 'Initial notification to supervisors'
    },
    {
        value: 'level_2',
        label: 'Level 2',
        description: 'Escalation to management'
    },
    {
        value: 'level_3',
        label: 'Level 3',
        description: 'Alert to emergency contacts'
    },
    {
        value: 'emergency',
        label: 'Emergency',
        description: 'Critical emergency response'
    }
];
/**
 * Get contact method options
 */
export const CONTACT_METHODS = [
    {
        value: 'sms',
        label: 'SMS',
        description: 'Text message notification'
    },
    {
        value: 'email',
        label: 'Email',
        description: 'Email notification'
    },
    {
        value: 'call',
        label: 'Phone Call',
        description: 'Voice call notification'
    }
];
