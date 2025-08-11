import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Clock, Users, MoreVertical, Edit, Trash2, Power, PowerOff, Calendar, AlertCircle } from 'lucide-react';
export function ScheduleList({ schedules, onEdit, onDelete, onToggleActive, onAssignStaff, loading }) {
    const [openMenuId, setOpenMenuId] = useState(null);
    const formatTime = (time) => {
        if (!time)
            return '';
        try {
            return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        catch {
            return time;
        }
    };
    const formatInterval = (minutes) => {
        if (minutes < 60)
            return `${minutes}m`;
        if (minutes === 60)
            return '1h';
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
    };
    const formatDaysOfWeek = (days) => {
        if (!days || days.length === 0)
            return 'No days selected';
        if (days.length === 7)
            return 'Every day';
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map(day => dayNames[day - 1]).join(', ');
    };
    const getFrequencyDisplay = (frequency) => {
        switch (frequency) {
            case 'daily': return 'Daily';
            case 'weekly': return 'Weekly';
            case 'custom': return 'Custom';
            case 'once': return 'One-time';
            default: return frequency;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsx("div", { className: "animate-pulse space-y-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-20 bg-gray-200 rounded" }, i))) }) }));
    }
    if (schedules.length === 0) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsxs("div", { className: "text-center py-8", children: [_jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No schedules" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by creating your first check-in schedule." })] }) }));
    }
    return (_jsxs("div", { className: "bg-white shadow rounded-lg overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Check-in Schedules" }) }), _jsx("div", { className: "divide-y divide-gray-200", children: schedules.map((schedule) => (_jsx("div", { className: "p-6 hover:bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${schedule.is_active ? 'bg-green-400' : 'bg-gray-400'}` }), _jsx("h4", { className: "text-lg font-medium text-gray-900 truncate", children: schedule.name }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${schedule.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'}`, children: schedule.is_active ? 'Active' : 'Inactive' })] }), schedule.description && (_jsx("p", { className: "mt-1 text-sm text-gray-600 truncate", children: schedule.description })), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsxs("span", { children: [formatInterval(schedule.check_in_interval_minutes), " intervals"] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: getFrequencyDisplay(schedule.frequency) })] }), schedule.start_time && schedule.end_time && (_jsxs("span", { children: [formatTime(schedule.start_time), " - ", formatTime(schedule.end_time)] })), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Users, { className: "w-4 h-4" }), _jsxs("span", { children: [schedule.activeAssignments, " active assignments"] })] })] }), (schedule.frequency === 'weekly' || schedule.frequency === 'custom') && (_jsxs("div", { className: "mt-2 text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Days:" }), " ", formatDaysOfWeek(schedule.days_of_week)] })), !schedule.is_active && (_jsxs("div", { className: "mt-2 flex items-center text-sm text-orange-600", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), _jsx("span", { children: "This schedule is inactive and won't trigger check-ins" })] }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: () => onAssignStaff(schedule), className: "inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "Assign Staff"] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setOpenMenuId(openMenuId === schedule.id ? null : schedule.id), className: "p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100", children: _jsx(MoreVertical, { className: "w-5 h-5" }) }), openMenuId === schedule.id && (_jsx("div", { className: "absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200", children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => {
                                                                onEdit(schedule);
                                                                setOpenMenuId(null);
                                                            }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Edit Schedule"] }), _jsx("button", { onClick: () => {
                                                                onToggleActive(schedule);
                                                                setOpenMenuId(null);
                                                            }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: schedule.is_active ? (_jsxs(_Fragment, { children: [_jsx(PowerOff, { className: "w-4 h-4 mr-2" }), "Deactivate"] })) : (_jsxs(_Fragment, { children: [_jsx(Power, { className: "w-4 h-4 mr-2" }), "Activate"] })) }), _jsxs("button", { onClick: () => {
                                                                onDelete(schedule);
                                                                setOpenMenuId(null);
                                                            }, className: "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Delete Schedule"] })] }) }))] })] })] }) }, schedule.id))) })] }));
}
