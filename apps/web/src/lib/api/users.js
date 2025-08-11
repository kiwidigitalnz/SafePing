import { supabase } from '../supabase';
/**
 * Get all users for an organization
 */
export async function getUsers(organizationId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('first_name', { ascending: true });
    if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
    return data || [];
}
/**
 * Get staff only
 */
export async function getStaff(organizationId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('role', 'worker')
        .eq('is_active', true)
        .order('first_name', { ascending: true });
    if (error) {
        throw new Error(`Failed to fetch staff: ${error.message}`);
    }
    return data || [];
}
/**
 * Get workers only (alias for backwards compatibility)
 * @deprecated Use getStaff instead
 */
export async function getWorkers(organizationId) {
    return getStaff(organizationId);
}
/**
 * Get user by ID
 */
export async function getUser(id) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data;
}
/**
 * Create a new user
 */
export async function createUser(userData) {
    const { data, error } = await supabase
        .from('users')
        .insert({
        ...userData,
        role: userData.role ?? 'worker',
        is_active: true,
        settings: {}
    })
        .select()
        .single();
    if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }
    return data;
}
/**
 * Update a user
 */
export async function updateUser(id, updates) {
    const { data, error } = await supabase
        .from('users')
        .update({
        ...updates,
        updated_at: new Date().toISOString()
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
    }
    return data;
}
/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(id) {
    return updateUser(id, { is_active: false });
}
/**
 * Activate a user
 */
export async function activateUser(id) {
    return updateUser(id, { is_active: true });
}
/**
 * Delete a user (hard delete)
 */
export async function deleteUser(id) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
    }
}
/**
 * Get user statistics
 */
export async function getUserStats(organizationId) {
    const { data, error } = await supabase
        .from('users')
        .select('is_active, role')
        .eq('organization_id', organizationId);
    if (error) {
        throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
    const users = data || [];
    const stats = users.reduce((acc, user) => {
        acc.total++;
        if (user.is_active) {
            acc.active++;
        }
        else {
            acc.inactive++;
        }
        acc.by_role[user.role]++;
        return acc;
    }, {
        total: 0,
        active: 0,
        inactive: 0,
        by_role: {
            super_admin: 0,
            admin: 0,
            supervisor: 0,
            worker: 0
        }
    });
    return stats;
}
/**
 * Search users by name or employee ID
 */
export async function searchUsers(organizationId, query) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_id.ilike.%${query}%`)
        .order('first_name', { ascending: true });
    if (error) {
        throw new Error(`Failed to search users: ${error.message}`);
    }
    return data || [];
}
