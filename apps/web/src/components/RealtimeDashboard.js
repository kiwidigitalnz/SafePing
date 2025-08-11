import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Activity, Users, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { RealtimeManager, realtimeStatus } from '../lib/realtime';
import { getUsers } from '../lib/api/users';
import { getRecentCheckIns } from '../lib/api/checkins';
import { getActiveIncidents } from '../lib/api/incidents';
export function RealtimeDashboard({ organizationId }) {
    const [stats, setStats] = useState({
        totalStaff: 0,
        safeStaff: 0,
        overdueStaff: 0,
        activeIncidents: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [realtimeManager] = useState(() => new RealtimeManager(organizationId));
    useEffect(() => {
        loadInitialData();
        setupRealtimeSubscriptions();
        // Monitor connection status
        const statusInterval = setInterval(() => {
            setIsConnected(realtimeStatus.isConnected);
        }, 1000);
        return () => {
            clearInterval(statusInterval);
            realtimeManager.unsubscribeAll();
        };
    }, [organizationId]);
    const loadInitialData = async () => {
        try {
            // Load staff
            const users = await getUsers(organizationId);
            const staff = users.filter(user => user.role === 'worker');
            // Load recent check-ins
            const recentCheckIns = await getRecentCheckIns(organizationId, 10);
            // Load active incidents
            const incidents = await getActiveIncidents(organizationId);
            // Calculate stats
            const safeCount = recentCheckIns.filter(checkIn => checkIn.status === 'safe').length;
            const overdueCount = recentCheckIns.filter(checkIn => checkIn.status === 'overdue').length;
            setStats({
                totalStaff: staff.length,
                safeStaff: safeCount,
                overdueStaff: overdueCount,
                activeIncidents: incidents.length
            });
            // Transform recent activity
            const activity = [
                ...recentCheckIns.slice(0, 5).map(checkIn => ({
                    id: checkIn.id,
                    type: 'check_in',
                    message: `${checkIn.user?.first_name} ${checkIn.user?.last_name} checked in (${checkIn.status})`,
                    timestamp: checkIn.created_at,
                    status: checkIn.status
                })),
                ...incidents.slice(0, 3).map(incident => ({
                    id: incident.id,
                    type: 'incident',
                    message: `Incident: ${incident.title}`,
                    timestamp: incident.created_at,
                    status: incident.severity === 'high' ? 'emergency' : 'overdue'
                }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivity(activity);
            setLastUpdated(new Date());
        }
        catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };
    const setupRealtimeSubscriptions = () => {
        // Subscribe to check-ins
        realtimeManager.subscribeToCheckIns({
            onInsert: (payload) => {
                console.log('New check-in:', payload.new);
                addRecentActivity({
                    id: payload.new.id,
                    type: 'check_in',
                    message: `Staff member checked in (${payload.new.status})`,
                    timestamp: payload.new.created_at,
                    status: payload.new.status
                });
                updateStatsFromCheckIn(payload.new.status, 'insert');
            },
            onUpdate: (payload) => {
                console.log('Updated check-in:', payload.new);
                addRecentActivity({
                    id: payload.new.id,
                    type: 'check_in',
                    message: `Check-in updated (${payload.new.status})`,
                    timestamp: payload.new.updated_at || payload.new.created_at,
                    status: payload.new.status
                });
                updateStatsFromCheckIn(payload.old?.status, 'delete');
                updateStatsFromCheckIn(payload.new.status, 'insert');
            }
        });
        // Subscribe to incidents
        realtimeManager.subscribeToIncidents({
            onInsert: (payload) => {
                console.log('New incident:', payload.new);
                addRecentActivity({
                    id: payload.new.id,
                    type: 'incident',
                    message: `New incident: ${payload.new.title}`,
                    timestamp: payload.new.created_at,
                    status: payload.new.severity === 'high' ? 'emergency' : 'overdue'
                });
                setStats(prev => ({
                    ...prev,
                    activeIncidents: prev.activeIncidents + 1
                }));
            },
            onUpdate: (payload) => {
                if (payload.new.status === 'resolved' && payload.old?.status !== 'resolved') {
                    addRecentActivity({
                        id: payload.new.id,
                        type: 'incident',
                        message: `Incident resolved: ${payload.new.title}`,
                        timestamp: payload.new.updated_at || payload.new.created_at,
                        status: 'resolved'
                    });
                    setStats(prev => ({
                        ...prev,
                        activeIncidents: Math.max(0, prev.activeIncidents - 1)
                    }));
                }
            }
        });
    };
    const addRecentActivity = (activity) => {
        setRecentActivity(prev => [activity, ...prev.slice(0, 9)]);
        setLastUpdated(new Date());
    };
    const updateStatsFromCheckIn = (status, operation) => {
        const multiplier = operation === 'insert' ? 1 : -1;
        setStats(prev => {
            const newStats = { ...prev };
            if (status === 'safe') {
                newStats.safeStaff = Math.max(0, prev.safeStaff + multiplier);
            }
            else if (status === 'overdue') {
                newStats.overdueStaff = Math.max(0, prev.overdueStaff + multiplier);
            }
            return newStats;
        });
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'safe': return _jsx(CheckCircle, { className: "w-4 h-4 text-green-600" });
            case 'overdue': return _jsx(Clock, { className: "w-4 h-4 text-orange-600" });
            case 'emergency': return _jsx(AlertTriangle, { className: "w-4 h-4 text-red-600" });
            case 'resolved': return _jsx(CheckCircle, { className: "w-4 h-4 text-blue-600" });
            default: return _jsx(Activity, { className: "w-4 h-4 text-gray-600" });
        }
    };
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffMins < 1440)
            return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };
    const refreshData = () => {
        loadInitialData();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between bg-white p-4 rounded-lg shadow", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [isConnected ? (_jsx(Wifi, { className: "w-5 h-5 text-green-600" })) : (_jsx(WifiOff, { className: "w-5 h-5 text-red-600" })), _jsx("span", { className: `text-sm font-medium ${isConnected ? 'text-green-800' : 'text-red-800'}`, children: isConnected ? 'Real-time Connected' : 'Disconnected' }), lastUpdated && (_jsxs("span", { className: "text-xs text-gray-500", children: ["Last updated: ", formatTimestamp(lastUpdated.toISOString())] }))] }), _jsx("button", { onClick: refreshData, className: "p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg", title: "Refresh data", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-white p-6 rounded-lg shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Staff" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stats.totalStaff })] })] }) }), _jsx("div", { className: "bg-white p-6 rounded-lg shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Safe" }), _jsx("p", { className: "text-2xl font-bold text-green-700", children: stats.safeStaff })] })] }) }), _jsx("div", { className: "bg-white p-6 rounded-lg shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-8 h-8 text-orange-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Overdue" }), _jsx("p", { className: "text-2xl font-bold text-orange-700", children: stats.overdueStaff })] })] }) }), _jsx("div", { className: "bg-white p-6 rounded-lg shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-8 h-8 text-red-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Incidents" }), _jsx("p", { className: "text-2xl font-bold text-red-700", children: stats.activeIncidents })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Recent Activity" }), _jsx("p", { className: "text-sm text-gray-600", children: "Live updates from your safety monitoring system" })] }), _jsx("div", { className: "divide-y divide-gray-200", children: recentActivity.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "No recent activity" })) : (recentActivity.map((activity) => (_jsxs("div", { className: "p-6 flex items-center space-x-4", children: [getStatusIcon(activity.status), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: activity.message }), _jsx("p", { className: "text-xs text-gray-500", children: formatTimestamp(activity.timestamp) })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.type === 'check_in'
                                        ? 'bg-blue-100 text-blue-800'
                                        : activity.type === 'incident'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'}`, children: activity.type.replace('_', ' ') })] }, activity.id)))) })] })] }));
}
