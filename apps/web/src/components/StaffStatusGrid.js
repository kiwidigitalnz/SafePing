import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useCheckInStore } from '../store/checkins';
import { useAuthStore } from '../store/auth';
import { CheckCircle, Clock, AlertTriangle, XCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
function StaffStatusCard({ checkIn, onClick }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'safe':
                return {
                    icon: CheckCircle,
                    bgColor: 'bg-green-50',
                    iconColor: 'text-green-600',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-800',
                    label: 'Safe',
                };
            case 'overdue':
                return {
                    icon: Clock,
                    bgColor: 'bg-yellow-50',
                    iconColor: 'text-yellow-600',
                    borderColor: 'border-yellow-200',
                    textColor: 'text-yellow-800',
                    label: 'Overdue',
                };
            case 'missed':
                return {
                    icon: XCircle,
                    bgColor: 'bg-red-50',
                    iconColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    textColor: 'text-red-800',
                    label: 'Missed',
                };
            case 'emergency':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-red-50 animate-pulse',
                    iconColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    textColor: 'text-red-800',
                    label: 'EMERGENCY',
                };
            default:
                return {
                    icon: User,
                    bgColor: 'bg-gray-50',
                    iconColor: 'text-gray-600',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-800',
                    label: 'Unknown',
                };
        }
    };
    const config = getStatusConfig(checkIn.status);
    const Icon = config.icon;
    const timeAgo = checkIn.created_at
        ? formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })
        : 'Never';
    return (_jsxs("div", { className: `
        relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
        ${config.bgColor} ${config.borderColor}
      `, onClick: onClick, children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 ${config.iconColor}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: [checkIn.users?.first_name, " ", checkIn.users?.last_name] }), _jsx("span", { className: `text-xs font-medium px-2 py-1 rounded-full ${config.textColor} ${config.bgColor}`, children: config.label })] }), checkIn.users?.employee_id && (_jsxs("p", { className: "text-xs text-gray-500", children: ["ID: ", checkIn.users.employee_id] })), _jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: "text-xs text-gray-600", children: ["Last check-in: ", timeAgo] }), checkIn.message && (_jsxs("p", { className: "text-xs text-gray-600 truncate mt-1", children: ["\"", checkIn.message, "\""] })), checkIn.location_address && (_jsxs("p", { className: "text-xs text-gray-500 truncate mt-1", children: ["\uD83D\uDCCD ", checkIn.location_address] }))] })] })] }), checkIn.status === 'emergency' && (_jsxs("div", { className: "absolute -top-1 -right-1", children: [_jsx("div", { className: "animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" }), _jsx("div", { className: "relative inline-flex rounded-full h-3 w-3 bg-red-500" })] }))] }));
}
export function StaffStatusGrid({ onStaffClick }) {
    const { user } = useAuthStore();
    const { latestCheckIns, loading, error, loadLatestCheckIns, subscribeToUpdates, unsubscribe, isConnected, selectCheckIn } = useCheckInStore();
    useEffect(() => {
        if (user?.organization_id) {
            // Load initial data
            loadLatestCheckIns();
            // Subscribe to real-time updates
            subscribeToUpdates(user.organization_id);
        }
        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [user?.organization_id]);
    // Auto-refresh every 30 seconds as fallback
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.organization_id) {
                loadLatestCheckIns();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.organization_id]);
    const handleStaffClick = (checkIn) => {
        selectCheckIn(checkIn);
        onStaffClick?.(checkIn);
    };
    if (loading && latestCheckIns.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-md p-4", children: [_jsx("p", { className: "text-sm text-red-800", children: error }), _jsx("button", { onClick: () => loadLatestCheckIns(), className: "mt-2 text-sm text-red-600 hover:text-red-800 underline", children: "Try again" })] }));
    }
    if (latestCheckIns.length === 0) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(User, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No staff yet" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Invite your first staff member to start monitoring their safety." })] }));
    }
    // Group staff by status for better organization
    const groupedStaff = {
        emergency: latestCheckIns.filter(c => c.status === 'emergency'),
        missed: latestCheckIns.filter(c => c.status === 'missed'),
        overdue: latestCheckIns.filter(c => c.status === 'overdue'),
        safe: latestCheckIns.filter(c => c.status === 'safe'),
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-900", children: ["Staff Status (", latestCheckIns.length, " staff)"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}` }), _jsx("span", { className: "text-xs text-gray-500", children: isConnected ? 'Live' : 'Offline' }), loading && (_jsx("div", { className: "animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full" }))] })] }), groupedStaff.emergency.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-red-600 mb-3 flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-1" }), "EMERGENCY (", groupedStaff.emergency.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: groupedStaff.emergency.map((checkIn) => (_jsx(StaffStatusCard, { checkIn: checkIn, onClick: () => handleStaffClick(checkIn) }, checkIn.id))) })] })), groupedStaff.missed.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-red-600 mb-3", children: ["MISSED CHECK-INS (", groupedStaff.missed.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: groupedStaff.missed.map((checkIn) => (_jsx(StaffStatusCard, { checkIn: checkIn, onClick: () => handleStaffClick(checkIn) }, checkIn.id))) })] })), groupedStaff.overdue.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-yellow-600 mb-3", children: ["OVERDUE (", groupedStaff.overdue.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: groupedStaff.overdue.map((checkIn) => (_jsx(StaffStatusCard, { checkIn: checkIn, onClick: () => handleStaffClick(checkIn) }, checkIn.id))) })] })), groupedStaff.safe.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-green-600 mb-3", children: ["SAFE (", groupedStaff.safe.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: groupedStaff.safe.map((checkIn) => (_jsx(StaffStatusCard, { checkIn: checkIn, onClick: () => handleStaffClick(checkIn) }, checkIn.id))) })] }))] }));
}
