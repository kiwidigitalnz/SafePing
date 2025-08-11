import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserPlus, MoreVertical, Edit, Trash2, Eye, UserCheck, UserX, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { StaffForm } from '../components/StaffForm';
import { StaffDetail } from '../components/StaffDetail';
import { supabase } from '../lib/supabase';
import { getUsers, createUser, updateUser, deleteUser, activateUser, deactivateUser, searchUsers, getUserStats } from '../lib/api/users';
export function Staff() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('list');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [sendingSMS, setSendingSMS] = useState(null);
    // Fetch all users
    const { data: allUsers = [], isLoading } = useQuery({
        queryKey: ['users', user?.organization_id],
        queryFn: () => getUsers(user.organization_id),
        enabled: !!user?.organization_id
    });
    // Fetch user statistics
    const { data: stats } = useQuery({
        queryKey: ['user-stats', user?.organization_id],
        queryFn: () => getUserStats(user.organization_id),
        enabled: !!user?.organization_id
    });
    // Search users when search term changes
    const { data: searchResults } = useQuery({
        queryKey: ['search-users', user?.organization_id, searchTerm],
        queryFn: () => searchUsers(user.organization_id, searchTerm),
        enabled: !!user?.organization_id && searchTerm.length > 2
    });
    // Mutations
    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            setViewMode('list');
        }
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            setViewMode('list');
            setSelectedStaff(null);
        }
    });
    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        }
    });
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }) => isActive ? activateUser(id) : deactivateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        }
    });
    // Filter users based on search, role, and status
    const filteredUsers = (searchTerm.length > 2 ? searchResults : allUsers)?.filter(user => {
        const roleMatch = filterRole === 'all' || user.role === filterRole;
        const statusMatch = filterStatus === 'all' ||
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);
        return roleMatch && statusMatch;
    }) || [];
    const handleCreate = async (data) => {
        await createMutation.mutateAsync({
            ...data,
            organization_id: user.organization_id
        });
    };
    const handleUpdate = async (data) => {
        if (!selectedStaff)
            return;
        await updateMutation.mutateAsync({ id: selectedStaff.id, data });
    };
    const handleDelete = async (staff) => {
        if (confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`)) {
            await deleteMutation.mutateAsync(staff.id);
            setOpenMenuId(null);
        }
    };
    const handleToggleActive = async (staff) => {
        await toggleActiveMutation.mutateAsync({
            id: staff.id,
            isActive: !staff.is_active
        });
        setOpenMenuId(null);
    };
    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        setViewMode('edit');
        setOpenMenuId(null);
    };
    const handleViewDetail = (staff) => {
        setSelectedStaff(staff);
        setViewMode('detail');
        setOpenMenuId(null);
    };
    const handleCancel = () => {
        setViewMode('list');
        setSelectedStaff(null);
    };
    const handleResendSMS = async (staff) => {
        if (!staff.phone) {
            alert('This staff member does not have a phone number on file.');
            return;
        }
        setSendingSMS(staff.id);
        setOpenMenuId(null);
        try {
            // Generate a new invitation token
            const invitationToken = crypto.randomUUID();
            // Update the user's invitation token
            await supabase
                .from('users')
                .update({
                invitation_token: invitationToken,
                invitation_sent_at: new Date().toISOString()
            })
                .eq('id', staff.id);
            // Send SMS via edge function
            const { data, error } = await supabase.functions.invoke('send-worker-invitation', {
                body: {
                    phoneNumber: staff.phone,
                    invitationToken,
                    workerName: `${staff.first_name} ${staff.last_name}`,
                    organizationName: 'SafePing'
                }
            });
            if (error)
                throw error;
            // Show success message
            alert(`SMS invitation resent to ${staff.first_name} ${staff.last_name} at ${staff.phone}`);
            // Refresh the user list
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
        catch (error) {
            console.error('Error resending SMS:', error);
            alert(`Failed to resend SMS: ${error.message || 'Unknown error'}`);
        }
        finally {
            setSendingSMS(null);
        }
    };
    const getRoleLabel = (role) => {
        switch (role) {
            case 'super_admin': return 'Super Admin';
            case 'admin': return 'Admin';
            case 'supervisor': return 'Supervisor';
            case 'worker': return 'Staff Member';
            default: return role;
        }
    };
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-blue-100 text-blue-800';
            case 'supervisor': return 'bg-green-100 text-green-800';
            case 'worker': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    if (!user?.organization_id) {
        return (_jsx("div", { className: "space-y-6", children: _jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsx("p", { className: "text-gray-500", children: "Access denied. Organization not found." }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Staff Management" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Manage your organization's staff members and their roles" })] }), viewMode === 'list' && (_jsxs("button", { onClick: () => navigate('/staff/invite'), className: "inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 transform transition-all hover:scale-[1.02] shadow-lg", children: [_jsx(UserPlus, { className: "w-5 h-5 mr-2" }), "Add Staff Member"] }))] }), viewMode === 'list' && stats && (_jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-4", children: [_jsx("div", { className: "bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100", children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center", children: _jsx(Users, { className: "h-6 w-6 text-gray-600" }) }) }), _jsx("div", { className: "ml-4 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Total Staff" }), _jsx("dd", { className: "text-2xl font-bold text-gray-900", children: stats.total })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100", children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center", children: _jsx(UserCheck, { className: "h-6 w-6 text-green-600" }) }) }), _jsx("div", { className: "ml-4 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Active" }), _jsx("dd", { className: "text-2xl font-bold text-gray-900", children: stats.active })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100", children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center", children: _jsx(UserX, { className: "h-6 w-6 text-red-600" }) }) }), _jsx("div", { className: "ml-4 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Inactive" }), _jsx("dd", { className: "text-2xl font-bold text-gray-900", children: stats.inactive })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100", children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-[#15a2a6]/20 to-teal-200 rounded-xl flex items-center justify-center", children: _jsx(Users, { className: "h-6 w-6 text-[#15a2a6]" }) }) }), _jsx("div", { className: "ml-4 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Staff Members" }), _jsx("dd", { className: "text-2xl font-bold text-gray-900", children: stats.by_role.worker || 0 })] }) })] }) }) })] })), viewMode === 'list' && (_jsx("div", { className: "bg-white shadow-lg rounded-2xl border border-gray-100 p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search staff by name, email, or employee ID...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-12 pr-4 py-3 block w-full border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all" })] }) }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("select", { value: filterRole, onChange: (e) => setFilterRole(e.target.value), className: "px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all bg-white", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "super_admin", children: "Super Admin" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "supervisor", children: "Supervisor" }), _jsx("option", { value: "worker", children: "Staff Member" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all bg-white", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] })] }) })), viewMode === 'list' && (_jsxs("div", { className: "bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100", children: [_jsx("div", { className: "px-6 py-5 border-b border-gray-100", children: _jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Staff Members (", filteredUsers.length, ")"] }) }), isLoading ? (_jsx("div", { className: "p-6", children: _jsx("div", { className: "animate-pulse space-y-4", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: "h-16 bg-gray-200 rounded" }, i))) }) })) : filteredUsers.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No staff members found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filters.'
                                    : 'Get started by adding your first staff member.' })] })) : (_jsx("div", { className: "divide-y divide-gray-200", children: filteredUsers.map((staff) => (_jsx("div", { className: "p-6 hover:bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center", children: _jsxs("span", { className: "text-sm font-medium text-gray-700", children: [staff.first_name[0], staff.last_name[0]] }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: [staff.first_name, " ", staff.last_name] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.role)}`, children: getRoleLabel(staff.role) }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.is_active
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'}`, children: staff.is_active ? 'Active' : 'Inactive' })] }), _jsxs("div", { className: "mt-1 flex items-center space-x-4 text-sm text-gray-500", children: [staff.email && (_jsx("span", { children: staff.email })), staff.phone && (_jsxs("span", { className: "flex items-center", children: [_jsx(MessageSquare, { className: "w-3 h-3 mr-1" }), staff.phone] })), staff.employee_id && (_jsxs("span", { children: ["ID: ", staff.employee_id] })), staff.department && (_jsx("span", { children: staff.department }))] })] })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setOpenMenuId(openMenuId === staff.id ? null : staff.id), className: "p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100", children: _jsx(MoreVertical, { className: "w-5 h-5" }) }), openMenuId === staff.id && (_jsx("div", { className: "absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200", children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => handleViewDetail(staff), className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "View Details"] }), _jsxs("button", { onClick: () => handleEdit(staff), className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Edit"] }), !staff.is_active && staff.phone && (_jsx("button", { onClick: () => handleResendSMS(staff), disabled: sendingSMS === staff.id, className: "flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed", children: sendingSMS === staff.id ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" }), "Sending..."] })) : (_jsxs(_Fragment, { children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Resend SMS Invitation"] })) })), _jsx("button", { onClick: () => handleToggleActive(staff), className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: staff.is_active ? (_jsxs(_Fragment, { children: [_jsx(UserX, { className: "w-4 h-4 mr-2" }), "Deactivate"] })) : (_jsxs(_Fragment, { children: [_jsx(UserCheck, { className: "w-4 h-4 mr-2" }), "Activate"] })) }), _jsxs("button", { onClick: () => handleDelete(staff), className: "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Delete"] })] }) }))] })] }) }, staff.id))) }))] })), viewMode === 'create' && (_jsx(StaffForm, { organizationId: user.organization_id, onSubmit: handleCreate, onCancel: handleCancel, loading: createMutation.isPending })), viewMode === 'edit' && selectedStaff && (_jsx(StaffForm, { staff: selectedStaff, organizationId: user.organization_id, onSubmit: handleUpdate, onCancel: handleCancel, loading: updateMutation.isPending })), viewMode === 'detail' && selectedStaff && (_jsx(StaffDetail, { staff: selectedStaff, onEdit: () => setViewMode('edit'), onClose: handleCancel }))] }));
}
