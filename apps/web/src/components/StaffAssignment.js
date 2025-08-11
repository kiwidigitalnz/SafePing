import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, X, Check, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getScheduleAssignments, assignUserToSchedule, unassignUserFromSchedule } from '../lib/api/schedules';
export function StaffAssignment({ schedule, organizationId, onClose, onAssignmentChange }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    // Fetch all users in the organization
    const { data: allUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['users', organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('first_name');
            if (error)
                throw error;
            return data;
        }
    });
    // Fetch current assignments for this schedule
    const { data: currentAssignments = [], isLoading: assignmentsLoading, refetch } = useQuery({
        queryKey: ['schedule-assignments', schedule.id],
        queryFn: () => getScheduleAssignments(schedule.id)
    });
    const currentAssignmentUserIds = currentAssignments.map(a => a.user_id);
    // Filter users based on search term
    const filteredUsers = allUsers.filter(user => `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleUserToggle = (userId) => {
        setSelectedUserIds(prev => prev.includes(userId)
            ? prev.filter(id => id !== userId)
            : [...prev, userId]);
    };
    const handleAssignSelected = async () => {
        if (selectedUserIds.length === 0)
            return;
        setLoading(true);
        try {
            // Assign all selected users
            await Promise.all(selectedUserIds.map(userId => assignUserToSchedule({
                schedule_id: schedule.id,
                organization_id: organizationId,
                user_id: userId,
                start_date: startDate,
                end_date: endDate || null
            })));
            setSelectedUserIds([]);
            await refetch();
            onAssignmentChange();
        }
        catch (error) {
            console.error('Error assigning users:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUnassign = async (userId) => {
        try {
            await unassignUserFromSchedule(schedule.id, userId);
            await refetch();
            onAssignmentChange();
        }
        catch (error) {
            console.error('Error unassigning user:', error);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: _jsxs("div", { className: "relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Assign Staff to Schedule" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Schedule: ", schedule.name] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-3", children: "Assignment Period" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "start_date", className: "block text-sm font-medium text-gray-700", children: "Start Date" }), _jsx("input", { type: "date", id: "start_date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "end_date", className: "block text-sm font-medium text-gray-700", children: "End Date (Optional)" }), _jsx("input", { type: "date", id: "end_date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" })] })] })] }), currentAssignments.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-3", children: ["Currently Assigned (", currentAssignments.length, ")"] }), _jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: _jsx("div", { className: "space-y-2", children: currentAssignments.map((assignment) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(User, { className: "w-4 h-4 text-green-600" }), _jsxs("span", { className: "text-sm font-medium text-green-900", children: [assignment.user.first_name, " ", assignment.user.last_name] }), _jsx("span", { className: "text-xs text-green-600", children: assignment.user.email })] }), _jsx("button", { onClick: () => handleUnassign(assignment.user_id), className: "text-red-600 hover:text-red-800 text-sm", children: "Remove" })] }, assignment.id))) }) })] })), _jsx("div", { className: "mb-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search staff by name, email, or employee ID...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" })] }) }), selectedUserIds.length > 0 && (_jsx("div", { className: "mb-4 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium text-primary", children: [selectedUserIds.length, " staff member(s) selected"] }), _jsxs("div", { className: "space-x-2", children: [_jsx("button", { onClick: () => setSelectedUserIds([]), className: "text-sm text-gray-600 hover:text-gray-800", children: "Clear" }), _jsxs("button", { onClick: handleAssignSelected, disabled: loading, className: "inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50", children: [_jsx(Check, { className: "w-4 h-4 mr-1" }), loading ? 'Assigning...' : 'Assign Selected'] })] })] }) })), _jsx("div", { className: "max-h-96 overflow-y-auto border border-gray-200 rounded-lg", children: usersLoading || assignmentsLoading ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Loading staff..." })] })) : filteredUsers.length === 0 ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx(Users, { className: "mx-auto h-8 w-8 text-gray-400" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: searchTerm ? 'No staff found matching your search.' : 'No staff available.' })] })) : (_jsx("div", { className: "divide-y divide-gray-200", children: filteredUsers.map((user) => {
                            const isCurrentlyAssigned = currentAssignmentUserIds.includes(user.id);
                            const isSelected = selectedUserIds.includes(user.id);
                            return (_jsx("div", { className: `p-4 hover:bg-gray-50 ${isCurrentlyAssigned ? 'bg-green-50' : ''}`, children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => handleUserToggle(user.id), disabled: isCurrentlyAssigned, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900", children: [user.first_name, " ", user.last_name] }), isCurrentlyAssigned && (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800", children: "Assigned" }))] }), _jsxs("div", { className: "text-sm text-gray-500", children: [user.email, " \u2022 ", user.job_title || 'Staff', user.employee_id && ` • ID: ${user.employee_id}`] })] })] }) }) }, user.id));
                        }) })) }), _jsx("div", { className: "mt-6 flex justify-end space-x-3", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: "Close" }) })] }) }));
}
