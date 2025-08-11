import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { signOut } from '../../lib/auth';
import { LayoutDashboard, Users, CheckCircle, Calendar, AlertTriangle, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { TrialBanner } from '../TrialBanner';
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Staff', href: '/staff', icon: Users },
    { name: 'Check-ins', href: '/checkins', icon: CheckCircle },
    { name: 'Schedules', href: '/schedules', icon: Calendar },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Settings', href: '/settings', icon: Settings },
];
export function DashboardLayout() {
    const { user } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const handleSignOut = async () => {
        try {
            await signOut();
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50/50", children: [_jsx(TrialBanner, {}), _jsx("div", { className: `lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`, children: _jsxs("div", { className: "fixed inset-0 z-40 flex", children: [_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-75", onClick: () => setSidebarOpen(false) }), _jsxs("div", { className: "relative flex w-full max-w-xs flex-col bg-white", children: [_jsx("div", { className: "absolute top-0 right-0 -mr-12 pt-2", children: _jsx("button", { type: "button", className: "ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white", onClick: () => setSidebarOpen(false), children: _jsx(X, { className: "h-6 w-6 text-white" }) }) }), _jsxs("div", { className: "h-0 flex-1 overflow-y-auto pt-5 pb-4", children: [_jsx("div", { className: "flex flex-shrink-0 items-center px-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-primary rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold", children: "S" }) }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: "SafePing" })] }) }), _jsx("nav", { className: "mt-5 space-y-1 px-2", children: navigation.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = location.pathname === item.href;
                                                return (_jsxs(Link, { to: item.href, className: `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive
                                                        ? 'bg-primary text-white'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, onClick: () => setSidebarOpen(false), children: [_jsx(Icon, { className: "mr-4 h-6 w-6" }), item.name] }, item.name));
                                            }) })] })] })] }) }), _jsx("div", { className: "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col", children: _jsxs("div", { className: "flex min-h-0 flex-1 flex-col bg-white border-r border-gray-100 shadow-sm", children: [_jsxs("div", { className: "flex flex-1 flex-col pt-8 pb-4 overflow-y-auto", children: [_jsx("div", { className: "flex items-center flex-shrink-0 px-6", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("img", { src: "/safeping-logo.png", alt: "SafePing", className: "w-10 h-10 rounded-lg" }), _jsxs("div", { children: [_jsx("span", { className: "text-2xl font-bold bg-gradient-to-r from-[#15a2a6] to-teal-500 bg-clip-text text-transparent", children: "SafePing" }), _jsx("p", { className: "text-xs text-gray-500", children: "Safety Management" })] })] }) }), _jsx("nav", { className: "mt-10 flex-1 space-y-1 px-4", children: navigation.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname.startsWith(item.href);
                                        return (_jsxs(Link, { to: item.href, className: `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive
                                                ? 'bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`, children: [_jsx(Icon, { className: `mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}` }), item.name] }, item.name));
                                    }) })] }), _jsx("div", { className: "flex-shrink-0 border-t border-gray-100 p-4", children: _jsxs("div", { className: "flex items-center px-2", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center", children: _jsxs("span", { className: "text-sm font-semibold text-gray-700", children: [user?.first_name?.[0], user?.last_name?.[0]] }) }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [user?.first_name, " ", user?.last_name] }), _jsx("p", { className: "text-xs text-gray-500 capitalize", children: user?.role?.replace('_', ' ') })] }), _jsx("button", { onClick: handleSignOut, className: "ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors", title: "Sign out", children: _jsx(LogOut, { className: "h-5 w-5" }) })] }) })] }) }), _jsxs("div", { className: "lg:pl-72 flex flex-col flex-1", children: [_jsx("div", { className: "sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50", children: _jsx("button", { type: "button", className: "-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary", onClick: () => setSidebarOpen(true), children: _jsx(Menu, { className: "h-6 w-6" }) }) }), _jsx("main", { className: "flex-1", children: _jsx("div", { className: "py-6", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx(Outlet, {}) }) }) })] })] }));
}
