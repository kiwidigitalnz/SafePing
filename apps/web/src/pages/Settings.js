import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { OverdueProcessor } from '../components/OverdueProcessor';
import { SMSConfig } from '../components/SMSConfig';
import { EscalationRules } from '../components/EscalationRules';
import { OrganizationProfile } from '../components/OrganizationProfile';
import { OrganizationUsage } from '../components/OrganizationUsage';
import { AdminManagement } from '../components/AdminManagement';
import { BillingManagement } from '../components/BillingManagement';
export function Settings() {
    const { user, hasPermission } = useAuthStore();
    const [activeTab, setActiveTab] = useState('organization');
    if (!user?.organization_id) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "No organization found" }) }));
    }
    const tabs = [
        {
            id: 'organization',
            name: 'Organization',
            description: 'Organization profile and settings',
            permission: 'manage_organization',
            icon: '🏢'
        },
        {
            id: 'admins',
            name: 'Administrators',
            description: 'Manage organization administrators',
            permission: 'manage_organization',
            icon: '👥'
        },
        {
            id: 'billing',
            name: 'Billing',
            description: 'Subscription and billing management',
            permission: 'manage_billing',
            icon: '💳'
        },
        {
            id: 'automation',
            name: 'Automation',
            description: 'Automated safety monitoring processes',
            permission: 'manage_settings',
            icon: '⚙️'
        },
        {
            id: 'escalations',
            name: 'Escalations',
            description: 'Configure escalation rules',
            permission: 'manage_settings',
            icon: '📈'
        },
        {
            id: 'notifications',
            name: 'Notifications',
            description: 'SMS and email settings',
            permission: 'manage_settings',
            icon: '📧'
        }
    ];
    const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Settings" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your organization settings and configuration" })] }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8", "aria-label": "Tabs", children: visibleTabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx("span", { className: "mr-2", children: tab.icon }), tab.name] }, tab.id))) }) }), _jsxs("div", { className: "mt-6", children: [activeTab === 'organization' && (_jsxs("div", { className: "space-y-6", children: [_jsx(OrganizationProfile, {}), _jsx(OrganizationUsage, {})] })), activeTab === 'admins' && (_jsx(AdminManagement, { organizationId: user.organization_id })), activeTab === 'billing' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Subscription & Billing" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manage your subscription plan and billing information" })] }), _jsx(BillingManagement, {})] })), activeTab === 'automation' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Automated Processing" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manage and monitor automated safety monitoring processes" })] }), _jsx(OverdueProcessor, {})] })), activeTab === 'escalations' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Escalation Rules" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure automated escalation notifications for overdue check-ins" })] }), _jsx(EscalationRules, { organizationId: user.organization_id })] })), activeTab === 'notifications' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Notification Settings" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure SMS and email services for emergency notifications" })] }), _jsx(SMSConfig, {})] }))] })] }));
}
