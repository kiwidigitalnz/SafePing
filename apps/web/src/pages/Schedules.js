import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { ScheduleList } from '../components/ScheduleList';
import { ScheduleForm } from '../components/ScheduleForm';
import { StaffAssignment } from '../components/StaffAssignment';
import { getSchedulesByOrganization, createSchedule, updateSchedule, deleteSchedule } from '../lib/api/schedules';
export function Schedules() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('list');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    // Fetch schedules
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['schedules', user?.organization_id],
        queryFn: () => getSchedulesByOrganization(user.organization_id),
        enabled: !!user?.organization_id
    });
    // Create schedule mutation
    const createMutation = useMutation({
        mutationFn: createSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setViewMode('list');
        }
    });
    // Update schedule mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateSchedule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setViewMode('list');
            setSelectedSchedule(null);
        }
    });
    // Delete schedule mutation
    const deleteMutation = useMutation({
        mutationFn: deleteSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        }
    });
    const handleCreateSchedule = async (data) => {
        await createMutation.mutateAsync(data);
    };
    const handleUpdateSchedule = async (data) => {
        if (!selectedSchedule)
            return;
        await updateMutation.mutateAsync({ id: selectedSchedule.id, data });
    };
    const handleEdit = (schedule) => {
        setSelectedSchedule(schedule);
        setViewMode('edit');
    };
    const handleDelete = async (schedule) => {
        if (confirm(`Are you sure you want to delete the schedule "${schedule.name}"?`)) {
            await deleteMutation.mutateAsync(schedule.id);
        }
    };
    const handleToggleActive = async (schedule) => {
        await updateMutation.mutateAsync({
            id: schedule.id,
            data: { is_active: !schedule.is_active }
        });
    };
    const handleAssignStaff = (schedule) => {
        setSelectedSchedule(schedule);
        setViewMode('assign');
    };
    const handleAssignmentChange = () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
    };
    const handleCancel = () => {
        setViewMode('list');
        setSelectedSchedule(null);
    };
    if (!user?.organization_id) {
        return (_jsx("div", { className: "space-y-6", children: _jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsx("p", { className: "text-gray-500", children: "Access denied. Organization not found." }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Check-in Schedules" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage automated check-in schedules and staff assignments" })] }), viewMode === 'list' && (_jsxs("button", { onClick: () => setViewMode('create'), className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Schedule"] }))] }), viewMode === 'list' && schedules.length > 0 && (_jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-3", children: [_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Calendar, { className: "h-6 w-6 text-gray-400" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Total Schedules" }), _jsx("dd", { className: "text-lg font-medium text-gray-900", children: schedules.length })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-6 h-6 bg-green-400 rounded-full" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Active Schedules" }), _jsx("dd", { className: "text-lg font-medium text-gray-900", children: schedules.filter(s => s.is_active).length })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-6 h-6 bg-blue-400 rounded-full" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Total Assignments" }), _jsx("dd", { className: "text-lg font-medium text-gray-900", children: schedules.reduce((sum, s) => sum + s.activeAssignments, 0) })] }) })] }) }) })] })), viewMode === 'list' && (_jsx(ScheduleList, { schedules: schedules, onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive, onAssignStaff: handleAssignStaff, loading: isLoading })), viewMode === 'create' && (_jsx(ScheduleForm, { organizationId: user.organization_id, onSubmit: handleCreateSchedule, onCancel: handleCancel, loading: createMutation.isPending })), viewMode === 'edit' && selectedSchedule && (_jsx(ScheduleForm, { schedule: selectedSchedule, organizationId: user.organization_id, onSubmit: handleUpdateSchedule, onCancel: handleCancel, loading: updateMutation.isPending })), viewMode === 'assign' && selectedSchedule && (_jsx(StaffAssignment, { schedule: selectedSchedule, organizationId: user.organization_id, onClose: handleCancel, onAssignmentChange: handleAssignmentChange }))] }));
}
