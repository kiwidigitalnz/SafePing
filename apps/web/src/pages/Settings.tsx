import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { OverdueProcessor } from '../components/OverdueProcessor'
import { SMSConfig } from '../components/SMSConfig'
import { EscalationRules } from '../components/EscalationRules'
import { OrganizationProfile } from '../components/OrganizationProfile'
import { OrganizationUsage } from '../components/OrganizationUsage'
import { AdminManagement } from '../components/AdminManagement'
import { BillingManagement } from '../components/BillingManagement'

type SettingsTab = 'organization' | 'admins' | 'billing' | 'automation' | 'escalations' | 'notifications'

export function Settings() {
  const { user, hasPermission } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization')

  if (!user?.organization_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No organization found</p>
      </div>
    )
  }

  const tabs = [
    {
      id: 'organization' as const,
      name: 'Organization',
      description: 'Organization profile and settings',
      permission: 'manage_organization' as const,
      icon: '🏢'
    },
    {
      id: 'admins' as const,
      name: 'Administrators',
      description: 'Manage organization administrators',
      permission: 'manage_organization' as const,
      icon: '👥'
    },
    {
      id: 'billing' as const,
      name: 'Billing',
      description: 'Subscription and billing management',
      permission: 'manage_billing' as const,
      icon: '💳'
    },
    {
      id: 'automation' as const,
      name: 'Automation',
      description: 'Automated safety monitoring processes',
      permission: 'manage_settings' as const,
      icon: '⚙️'
    },
    {
      id: 'escalations' as const,
      name: 'Escalations',
      description: 'Configure escalation rules',
      permission: 'manage_settings' as const,
      icon: '📈'
    },
    {
      id: 'notifications' as const,
      name: 'Notifications',
      description: 'SMS and email settings',
      permission: 'manage_settings' as const,
      icon: '📧'
    }
  ]

  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your organization settings and configuration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'organization' && (
          <div className="space-y-6">
            <OrganizationProfile />
            <OrganizationUsage />
          </div>
        )}

        {activeTab === 'admins' && (
          <AdminManagement organizationId={user.organization_id} />
        )}

        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Subscription & Billing</h2>
              <p className="text-sm text-gray-600">
                Manage your subscription plan and billing information
              </p>
            </div>
            <BillingManagement />
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Automated Processing</h2>
              <p className="text-sm text-gray-600">
                Manage and monitor automated safety monitoring processes
              </p>
            </div>
            <OverdueProcessor />
          </div>
        )}

        {activeTab === 'escalations' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Escalation Rules</h2>
              <p className="text-sm text-gray-600">
                Configure automated escalation notifications for overdue check-ins
              </p>
            </div>
            <EscalationRules organizationId={user.organization_id} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-600">
                Configure SMS and email services for emergency notifications
              </p>
            </div>
            <SMSConfig />
          </div>
        )}
      </div>
    </div>
  )
}