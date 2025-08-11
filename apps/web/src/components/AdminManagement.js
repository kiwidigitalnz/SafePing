import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
const inviteSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.enum(['org_admin', 'admin']),
});
export function AdminManagement({ organizationId }) {
    const { user } = useAuthStore();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: 'admin',
        },
    });
    useEffect(() => {
        loadAdmins();
    }, [organizationId]);
    const loadAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('organization_admins')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            setAdmins(data || []);
        }
        catch (error) {
            console.error('Error loading admins:', error);
            setMessage({
                type: 'error',
                text: 'Failed to load administrators'
            });
        }
        finally {
            setLoading(false);
        }
    };
    const onInvite = async (data) => {
        setInviteLoading(true);
        setMessage(null);
        try {
            // Get organization name for invitation email
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', organizationId)
                .single();
            // Create admin invitation record
            const { error: invitationError } = await supabase
                .from('admin_invitations')
                .insert({
                organization_id: organizationId,
                invited_by: user?.id,
                email: data.email,
                first_name: data.firstName,
                last_name: data.lastName,
                role: data.role,
                verification_code_id: null // Will be set by Edge Function
            });
            if (invitationError)
                throw invitationError;
            // Send invitation email with verification code
            const { error: emailError } = await supabase.functions.invoke('send-verification-code', {
                body: {
                    email: data.email,
                    type: 'admin_invitation',
                    organizationName: orgData?.name || 'Your Organization',
                    firstName: data.firstName,
                    lastName: data.lastName,
                    metadata: {
                        organization_name: orgData?.name,
                        inviter_name: `${user?.first_name} ${user?.last_name}`,
                        role: data.role
                    }
                }
            });
            if (emailError)
                throw emailError;
            setMessage({
                type: 'success',
                text: `Successfully sent invitation to ${data.firstName} ${data.lastName}. They will receive a verification code via email.`
            });
            setShowInviteForm(false);
            reset();
            loadAdmins();
        }
        catch (error) {
            console.error('Error inviting admin:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to invite administrator'
            });
        }
        finally {
            setInviteLoading(false);
        }
    };
    const toggleAdminStatus = async (adminId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                is_active: !currentStatus,
                updated_at: new Date().toISOString()
            })
                .eq('id', adminId);
            if (error)
                throw error;
            setMessage({
                type: 'success',
                text: `Administrator ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            });
            loadAdmins();
        }
        catch (error) {
            console.error('Error updating admin status:', error);
            setMessage({
                type: 'error',
                text: 'Failed to update administrator status'
            });
        }
    };
    const updateAdminRole = async (adminId, newRole) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                role: newRole,
                updated_at: new Date().toISOString()
            })
                .eq('id', adminId);
            if (error)
                throw error;
            setMessage({
                type: 'success',
                text: 'Administrator role updated successfully'
            });
            loadAdmins();
        }
        catch (error) {
            console.error('Error updating admin role:', error);
            setMessage({
                type: 'error',
                text: 'Failed to update administrator role'
            });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/4 mb-4" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4" })] })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [message && (_jsx("div", { className: `p-4 rounded-md ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'}`, children: message.text })), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Administrators" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage organization administrators and their permissions" })] }), _jsx("button", { onClick: () => setShowInviteForm(true), className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Add Administrator" })] }) }), _jsxs("div", { className: "px-6 py-4", children: [showInviteForm && (_jsxs("div", { className: "mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50", children: [_jsx("h4", { className: "text-md font-medium text-gray-900 mb-4", children: "Invite Administrator" }), _jsxs("form", { onSubmit: handleSubmit(onInvite), className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "First Name *" }), _jsx("input", { ...register('firstName'), type: "text", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm", placeholder: "Enter first name" }), errors.firstName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.firstName.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Last Name *" }), _jsx("input", { ...register('lastName'), type: "text", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm", placeholder: "Enter last name" }), errors.lastName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.lastName.message }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email Address *" }), _jsx("input", { ...register('email'), type: "email", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm", placeholder: "Enter email address" }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Role *" }), _jsxs("select", { ...register('role'), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm", children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "org_admin", children: "Organization Admin" })] }), errors.role && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.role.message }))] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => {
                                                            setShowInviteForm(false);
                                                            reset();
                                                        }, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: inviteLoading, className: "px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:opacity-50", children: inviteLoading ? 'Adding...' : 'Add Administrator' })] })] })] })), admins.length === 0 ? (_jsx("div", { className: "text-center py-6", children: _jsx("p", { className: "text-gray-500", children: "No administrators found" }) })) : (_jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Administrator" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: admins.map((admin) => (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-8 w-8", children: _jsx("div", { className: "h-8 w-8 rounded-full bg-primary flex items-center justify-center", children: _jsxs("span", { className: "text-sm font-medium text-white", children: [admin.first_name.charAt(0), admin.last_name.charAt(0)] }) }) }), _jsxs("div", { className: "ml-4", children: [_jsxs("div", { className: "text-sm font-medium text-gray-900", children: [admin.first_name, " ", admin.last_name, admin.is_primary_admin && (_jsx("span", { className: "ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: "Primary" }))] }), _jsx("div", { className: "text-sm text-gray-500", children: admin.email })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("select", { value: admin.role, onChange: (e) => updateAdminRole(admin.id, e.target.value), disabled: admin.id === user?.id || admin.is_primary_admin, className: "text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed", children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "org_admin", children: "Organization Admin" })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'}`, children: admin.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: admin.id !== user?.id && !admin.is_primary_admin && (_jsx("button", { onClick: () => toggleAdminStatus(admin.id, admin.is_active), className: `${admin.is_active
                                                                ? 'text-red-600 hover:text-red-900'
                                                                : 'text-green-600 hover:text-green-900'}`, children: admin.is_active ? 'Deactivate' : 'Activate' })) })] }, admin.id))) })] }) }))] })] })] }));
}
