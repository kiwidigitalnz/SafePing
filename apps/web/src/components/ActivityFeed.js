import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useCheckInStore } from '../store/checkins';
import { useAuthStore } from '../store/auth';
import { CheckCircle, Clock, AlertTriangle, XCircle, MapPin, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
function ActivityItem({ checkIn, onClick }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'safe':
                return {
                    icon: CheckCircle,
                    iconColor: 'text-green-600',
                    bgColor: 'bg-green-100',
                    label: 'checked in safely',
                };
            case 'overdue':
                return {
                    icon: Clock,
                    iconColor: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    label: 'is overdue for check-in',
                };
            case 'missed':
                return {
                    icon: XCircle,
                    iconColor: 'text-red-600',
                    bgColor: 'bg-red-100',
                    label: 'missed check-in',
                };
            case 'emergency':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-red-600',
                    bgColor: 'bg-red-100',
                    label: 'sent an SOS alert',
                };
            default:
                return {
                    icon: CheckCircle,
                    iconColor: 'text-gray-600',
                    bgColor: 'bg-gray-100',
                    label: 'updated status',
                };
        }
    };
    const config = getStatusConfig(checkIn.status);
    const Icon = config.icon;
    const timeAgo = formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true });
    const fullTime = format(new Date(checkIn.created_at), 'MMM d, yyyy h:mm a');
    return (_jsx("div", { className: "group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-2 border-transparent hover:border-primary", onClick: onClick, children: _jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} ring-2 ring-white shadow-sm`, children: _jsx(Icon, { className: `w-5 h-5 ${config.iconColor}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm", children: [_jsxs("span", { className: "font-semibold text-gray-900", children: [checkIn.users?.first_name, " ", checkIn.users?.last_name] }), ' ', _jsx("span", { className: `${checkIn.status === 'emergency' ? 'font-semibold text-red-600' : 'text-gray-600'}`, children: config.label })] }), checkIn.users?.employee_id && (_jsxs("p", { className: "text-xs text-gray-500 mt-0.5", children: ["ID: ", checkIn.users.employee_id] }))] }), _jsx("time", { className: "text-xs text-gray-400 ml-2 whitespace-nowrap", title: fullTime, children: timeAgo })] }), checkIn.message && (_jsxs("div", { className: "mt-2 flex items-start space-x-2", children: [_jsx(MessageSquare, { className: "w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" }), _jsxs("p", { className: "text-sm text-gray-700 italic", children: ["\"", checkIn.message, "\""] })] })), checkIn.location_address && (_jsxs("div", { className: "mt-2 flex items-center space-x-2", children: [_jsx(MapPin, { className: "w-3.5 h-3.5 text-gray-400" }), _jsx("p", { className: "text-xs text-gray-600 truncate", children: checkIn.location_address })] }))] })] }) }));
}
export function ActivityFeed({ limit = 10, showHeader = true, onItemClick }) {
    const { user } = useAuthStore();
    const { checkIns, loading, error, loadCheckIns, selectCheckIn, filters, setFilters } = useCheckInStore();
    useEffect(() => {
        if (user?.organization_id) {
            // Load recent check-ins
            loadCheckIns({ limit });
        }
    }, [user?.organization_id, limit]);
    // Auto-refresh every minute
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.organization_id) {
                loadCheckIns({ limit });
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [user?.organization_id, limit]);
    const handleItemClick = (checkIn) => {
        selectCheckIn(checkIn);
        onItemClick?.(checkIn);
    };
    const handleFilterByStatus = (status) => {
        if (filters.status === status) {
            // Remove filter if already applied
            setFilters({ status: undefined });
        }
        else {
            setFilters({ status });
        }
    };
    if (loading && checkIns.length === 0) {
        return (_jsxs("div", { children: [showHeader && (_jsx("div", { className: "px-6 py-4 border-b border-gray-100", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }) })), _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) })] }));
    }
    if (error) {
        return (_jsxs("div", { children: [showHeader && (_jsx("div", { className: "px-6 py-4 border-b border-gray-100", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }) })), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-red-800", children: error }), _jsx("button", { onClick: () => loadCheckIns({ limit }), className: "mt-2 text-sm text-red-600 hover:text-red-800 font-medium", children: "Try again" })] }) })] }));
    }
    const displayedCheckIns = checkIns.slice(0, limit);
    return (_jsxs("div", { children: [showHeader && (_jsx("div", { className: "px-6 py-4 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }), loading && (_jsx("div", { className: "animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full" }))] }) })), _jsx("div", { className: "max-h-[600px] overflow-y-auto", children: displayedCheckIns.length > 0 ? (_jsx("div", { className: "divide-y divide-gray-50", children: displayedCheckIns.map((checkIn) => (_jsx(ActivityItem, { checkIn: checkIn, onClick: () => handleItemClick(checkIn) }, checkIn.id))) })) : (_jsxs("div", { className: "text-center py-12 px-6", children: [_jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "w-8 h-8 text-gray-400" }) }), _jsx("h3", { className: "text-sm font-medium text-gray-900", children: "No activity yet" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Check-ins will appear here as workers submit them." })] })) }), checkIns.length > limit && (_jsx("div", { className: "px-6 py-3 border-t border-gray-100 bg-gray-50", children: _jsx("button", { onClick: () => {
                        loadCheckIns({ limit: limit + 10 });
                    }, className: "text-sm text-primary hover:text-primary/80 font-medium transition-colors", children: "View all activity \u2192" }) }))] }));
}
