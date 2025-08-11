import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useCheckInStore } from '../store/checkins';
import { useAuthStore } from '../store/auth';
import { StaffStatusGrid } from '../components/StaffStatusGrid';
import { ActivityFeed } from '../components/ActivityFeed';
import { TestCheckInButton } from '../components/TestCheckInButton';
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp, Shield, Plus, Settings } from 'lucide-react';
function StatsCard({ title, value, icon: Icon, color, subtitle, trend }) {
    return (_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `flex-shrink-0 p-3 rounded-md ${color}`, children: _jsx(Icon, { className: "h-6 w-6 text-white" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: title }), _jsxs("dd", { className: "flex items-baseline", children: [_jsx("div", { className: "text-2xl font-semibold text-gray-900", children: value }), subtitle && (_jsx("div", { className: "ml-2 text-sm text-gray-500", children: subtitle }))] }), trend && (_jsxs("dd", { className: "flex items-center text-sm", children: [_jsx(TrendingUp, { className: `w-4 h-4 mr-1 ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}` }), _jsx("span", { className: trend.direction === 'up' ? 'text-green-600' : 'text-red-600', children: trend.value }), _jsx("span", { className: "text-gray-500 ml-1", children: trend.label })] }))] }) })] }) }));
}
function StaffDetailModal({ checkIn, isOpen, onClose }) {
    const { acknowledge } = useCheckInStore();
    const [acknowledging, setAcknowledging] = useState(false);
    const [notes, setNotes] = useState('');
    if (!isOpen || !checkIn)
        return null;
    const handleAcknowledge = async () => {
        setAcknowledging(true);
        try {
            await acknowledge(checkIn.id, notes);
            onClose();
        }
        catch (error) {
            console.error('Failed to acknowledge:', error);
        }
        finally {
            setAcknowledging(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: _jsx("div", { className: "relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white", children: _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Staff Details" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-900", children: [checkIn.users?.first_name, " ", checkIn.users?.last_name] }), checkIn.users?.employee_id && (_jsxs("p", { className: "text-sm text-gray-500", children: ["ID: ", checkIn.users.employee_id] }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Status" }), _jsx("p", { className: `text-sm font-medium ${checkIn.status === 'safe' ? 'text-green-600' :
                                            checkIn.status === 'overdue' ? 'text-yellow-600' :
                                                'text-red-600'}`, children: checkIn.status.toUpperCase() })] }), checkIn.message && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Message" }), _jsx("p", { className: "text-sm text-gray-900", children: checkIn.message })] })), checkIn.location_address && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Location" }), _jsx("p", { className: "text-sm text-gray-900", children: checkIn.location_address })] })), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Check-in Time" }), _jsx("p", { className: "text-sm text-gray-900", children: new Date(checkIn.created_at).toLocaleString() })] }), (checkIn.status === 'overdue' || checkIn.status === 'missed' || checkIn.status === 'emergency') && (_jsxs("div", { children: [_jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-gray-700 mb-1", children: "Acknowledgment Notes" }), _jsx("textarea", { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", rows: 3, placeholder: "Add notes about your response..." })] }))] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200", children: "Close" }), (checkIn.status === 'overdue' || checkIn.status === 'missed' || checkIn.status === 'emergency') && (_jsx("button", { onClick: handleAcknowledge, disabled: acknowledging, className: "px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50", children: acknowledging ? 'Acknowledging...' : 'Acknowledge' }))] })] }) }) }));
}
export function Dashboard() {
    const { user } = useAuthStore();
    const { stats, loadStats, selectedCheckIn, selectCheckIn } = useCheckInStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    // Use actual organization ID from authenticated user
    const organizationId = user?.organization_id || null;
    useEffect(() => {
        if (organizationId) {
            setLoading(true);
            loadStats().finally(() => setLoading(false));
            // Refresh stats every 2 minutes
            const interval = setInterval(() => {
                loadStats();
            }, 120000);
            return () => clearInterval(interval);
        }
        else {
            setLoading(false);
        }
    }, [organizationId, loadStats]);
    useEffect(() => {
        if (selectedCheckIn) {
            setModalOpen(true);
        }
    }, [selectedCheckIn]);
    const handleCloseModal = () => {
        setModalOpen(false);
        selectCheckIn(null);
    };
    // Show empty state if no organization
    if (!organizationId) {
        return (_jsx("div", { className: "min-h-[60vh] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Users, { className: "w-8 h-8 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Welcome to SafePing" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md", children: "Complete your organization setup to start monitoring your staff safety." }), _jsxs("button", { className: "inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors", children: [_jsx(Settings, { className: "w-4 h-4 mr-2" }), "Complete Setup"] })] }) }));
    }
    const statsCards = [
        {
            title: 'Total Staff',
            value: loading ? '...' : (stats?.total || 0),
            icon: Users,
            color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        {
            title: 'Safe Check-ins',
            value: loading ? '...' : (stats?.safe || 0),
            icon: CheckCircle,
            color: 'bg-gradient-to-r from-green-500 to-green-600',
            subtitle: 'last 24h',
        },
        {
            title: 'Overdue',
            value: loading ? '...' : (stats?.overdue || 0),
            icon: Clock,
            color: 'bg-gradient-to-r from-amber-500 to-orange-500',
        },
        {
            title: 'Compliance Rate',
            value: loading ? '...' : (stats?.onTimeRate ? `${stats.onTimeRate}%` : '100%'),
            icon: Shield,
            color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        },
    ];
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Dashboard" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Monitor your team's safety in real-time" })] }), _jsxs("div", { className: "mt-4 sm:mt-0 flex items-center space-x-3", children: [process.env.NODE_ENV === 'development' && _jsx(TestCheckInButton, {}), _jsxs("button", { className: "inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Staff"] })] })] }), _jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4", children: statsCards.map((stat) => (_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `flex-shrink-0 p-3 rounded-lg ${stat.color} shadow-sm`, children: _jsx(stat.icon, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { className: "ml-4 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.title }), _jsxs("div", { className: "flex items-baseline", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: stat.value }), stat.subtitle && (_jsx("span", { className: "ml-2 text-sm text-gray-500", children: stat.subtitle }))] })] })] }) }, stat.title))) }), (stats?.emergency || 0) > 0 && (_jsx("div", { className: "bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center", children: _jsx(AlertTriangle, { className: "h-5 w-5 text-white" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-lg font-semibold text-red-900", children: "Emergency Alert" }), _jsxs("p", { className: "mt-1 text-red-800", children: [stats?.emergency, " staff member(s) have sent SOS alerts and require immediate attention."] }), _jsx("button", { className: "mt-3 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium", children: "View Emergency Details" })] })] }) })), (stats?.missed || 0) > 0 && (_jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-6", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center", children: _jsx(Clock, { className: "h-5 w-5 text-white" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-lg font-semibold text-amber-900", children: "Missed Check-ins" }), _jsxs("p", { className: "mt-1 text-amber-800", children: [stats?.missed, " staff member(s) have missed their scheduled check-ins."] }), _jsx("button", { className: "mt-3 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium", children: "Review Missed Check-ins" })] })] }) })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [_jsxs("div", { className: "p-6 border-b border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Staff Status" }), _jsx("p", { className: "text-sm text-gray-600", children: "Current status of all team members" })] }), _jsx(StaffStatusGrid, { onStaffClick: () => { } })] }) }), _jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [_jsxs("div", { className: "p-6 border-b border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }), _jsx("p", { className: "text-sm text-gray-600", children: "Latest check-ins and alerts" })] }), _jsx(ActivityFeed, { limit: 8 })] }) })] }), _jsx(StaffDetailModal, { checkIn: selectedCheckIn, isOpen: modalOpen, onClose: handleCloseModal })] }));
}
