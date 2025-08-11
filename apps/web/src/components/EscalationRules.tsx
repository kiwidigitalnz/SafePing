import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Power, PowerOff, AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react'
import { 
  getEscalationRules, 
  deleteEscalationRule, 
  toggleEscalationRule,
  ESCALATION_LEVELS,
  CONTACT_METHODS
} from '../lib/api/escalations'
import type { EscalationRule } from '../lib/api/escalations'
import { EscalationRuleForm } from './EscalationRuleForm'

interface EscalationRulesProps {
  organizationId: string
}

export function EscalationRules({ organizationId }: EscalationRulesProps) {
  const [rules, setRules] = useState<EscalationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadRules()
  }, [organizationId])

  const loadRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEscalationRules(organizationId)
      setRules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalation rules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingRule(null)
    setShowForm(true)
  }

  const handleEdit = (rule: EscalationRule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return

    try {
      setDeletingId(id)
      await deleteEscalationRule(id)
      setRules(rules.filter(rule => rule.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete escalation rule')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (rule: EscalationRule) => {
    try {
      const updatedRule = await toggleEscalationRule(rule.id, !rule.is_active)
      setRules(rules.map(r => r.id === rule.id ? updatedRule : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update escalation rule')
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingRule(null)
    loadRules()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingRule(null)
  }

  const getLevelInfo = (level: string) => {
    return ESCALATION_LEVELS.find(l => l.value === level) || { label: level, description: '' }
  }

  const getContactMethodInfo = (method: string) => {
    return CONTACT_METHODS.find(m => m.value === method) || { label: method, description: '' }
  }

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Escalation Rules</h3>
          <p className="text-sm text-gray-600">
            Configure automated escalation notifications for overdue check-ins
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Escalation Rules</h3>
          <p className="text-gray-600 mb-4">
            Create escalation rules to automatically notify contacts when workers are overdue.
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const levelInfo = getLevelInfo(rule.level)
            const methodInfo = getContactMethodInfo(rule.contact_method)
            
            return (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.level === 'emergency' 
                          ? 'bg-red-100 text-red-800'
                          : rule.level === 'level_3'
                          ? 'bg-orange-100 text-orange-800' 
                          : rule.level === 'level_2'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {levelInfo.label}
                      </span>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        {getContactMethodIcon(rule.contact_method)}
                        <span className="ml-1">{methodInfo.label}</span>
                      </div>
                      
                      <span className="text-sm text-gray-500">
                        {rule.delay_minutes} min delay
                      </span>
                      
                      <span className="text-sm text-gray-500">
                        {rule.contact_list.length} contact{rule.contact_list.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {levelInfo.description}
                    </p>
                    
                    {rule.message_template && (
                      <p className="text-sm text-gray-500 italic">
                        "{rule.message_template.slice(0, 100)}{rule.message_template.length > 100 ? '...' : ''}"
                      </p>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rule.contact_list.map((contact, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {contact}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`p-2 rounded-lg ${
                        rule.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={rule.is_active ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete rule"
                    >
                      <Trash2 className={`w-4 h-4 ${deletingId === rule.id ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <EscalationRuleForm
          organizationId={organizationId}
          rule={editingRule}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}