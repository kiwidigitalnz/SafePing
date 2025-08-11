import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import {
  createEscalationRule,
  updateEscalationRule,
  validateEscalationRule,
  ESCALATION_LEVELS,
  CONTACT_METHODS
} from '../lib/api/escalations'
import type { EscalationRule, EscalationLevel, CreateEscalationRuleData, ContactMethod } from '../lib/api/escalations'
import { getSchedules } from '../lib/api/schedules'

interface EscalationRuleFormProps {
  organizationId: string
  rule?: EscalationRule | null
  onSubmit: () => void
  onCancel: () => void
}

interface Schedule {
  id: string
  name: string
}

export function EscalationRuleForm({ organizationId, rule, onSubmit, onCancel }: EscalationRuleFormProps) {
  const [formData, setFormData] = useState({
    level: 'level_1' as EscalationLevel,
    delay_minutes: 5,
    contact_method: 'sms' as ContactMethod,
    contact_list: [''],
    message_template: '',
    schedule_id: null as string | null,
    is_active: true
  })

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    loadSchedules()
    
    if (rule) {
      setFormData({
        level: rule.level,
        delay_minutes: rule.delay_minutes,
        contact_method: rule.contact_method,
        contact_list: rule.contact_list.length > 0 ? rule.contact_list : [''],
        message_template: rule.message_template || '',
        schedule_id: rule.schedule_id,
        is_active: rule.is_active
      })
    }
  }, [rule])

  const loadSchedules = async () => {
    try {
      const data = await getSchedules(organizationId)
      setSchedules(data)
    } catch (err) {
      console.error('Failed to load schedules:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors([])

    // Filter out empty contacts
    const cleanedContacts = formData.contact_list.filter(contact => contact.trim() !== '')
    
    const dataToValidate: Partial<CreateEscalationRuleData> = {
      organization_id: organizationId,
      schedule_id: formData.schedule_id,
      level: formData.level,
      delay_minutes: formData.delay_minutes,
      contact_method: formData.contact_method,
      contact_list: cleanedContacts,
      message_template: formData.message_template || null,
      is_active: formData.is_active
    }

    const validation = validateEscalationRule(dataToValidate)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    try {
      setLoading(true)
      
      if (rule) {
        await updateEscalationRule(rule.id, {
          level: formData.level,
          delay_minutes: formData.delay_minutes,
          contact_method: formData.contact_method,
          contact_list: cleanedContacts,
          message_template: formData.message_template || null,
          is_active: formData.is_active
        })
      } else {
        await createEscalationRule({
          organization_id: organizationId,
          schedule_id: formData.schedule_id,
          level: formData.level,
          delay_minutes: formData.delay_minutes,
          contact_method: formData.contact_method,
          contact_list: cleanedContacts,
          message_template: formData.message_template || null,
          is_active: formData.is_active
        })
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save escalation rule')
    } finally {
      setLoading(false)
    }
  }

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contact_list: [...prev.contact_list, '']
    }))
  }

  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contact_list: prev.contact_list.filter((_, i) => i !== index)
    }))
  }

  const updateContact = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_list: prev.contact_list.map((contact, i) => 
        i === index ? value : contact
      )
    }))
  }

  const getContactPlaceholder = () => {
    switch (formData.contact_method) {
      case 'sms':
      case 'call':
        return '+64021234567'
      case 'email':
        return 'supervisor@company.com'
      default:
        return ''
    }
  }

  const getDefaultMessage = () => {
    const workerName = '{{worker_name}}'
    const overdueTime = '{{overdue_time}}'
    
    switch (formData.level) {
      case 'level_1':
        return `SAFETY ALERT: ${workerName} is ${overdueTime} overdue for check-in. Please verify their safety immediately.`
      case 'level_2':
        return `URGENT: ${workerName} has been overdue for ${overdueTime}. Escalating to management. Please take immediate action.`
      case 'level_3':
        return `EMERGENCY: ${workerName} has been missing for ${overdueTime}. Emergency response may be required.`
      case 'emergency':
        return `CRITICAL: ${workerName} has been missing for ${overdueTime}. All emergency protocols activated.`
      default:
        return ''
    }
  }

  const useDefaultMessage = () => {
    setFormData(prev => ({
      ...prev,
      message_template: getDefaultMessage()
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {rule ? 'Edit Escalation Rule' : 'Create Escalation Rule'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Validation Errors</span>
              </div>
              <ul className="text-red-700 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Schedule Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apply To Schedule
            </label>
            <select
              value={formData.schedule_id || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                schedule_id: e.target.value || null
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Schedules (Global Rule)</option>
              {schedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Leave blank to apply this rule to all schedules
            </p>
          </div>

          {/* Escalation Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                level: e.target.value as EscalationLevel
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              {ESCALATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          {/* Delay Minutes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger After (minutes overdue)
            </label>
            <input
              type="number"
              min="0"
              value={formData.delay_minutes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                delay_minutes: parseInt(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              How many minutes after the grace period expires should this escalation trigger
            </p>
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Method
            </label>
            <select
              value={formData.contact_method}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact_method: e.target.value as ContactMethod
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              {CONTACT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label} - {method.description}
                </option>
              ))}
            </select>
          </div>

          {/* Contact List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact List
            </label>
            <div className="space-y-2">
              {formData.contact_list.map((contact, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => updateContact(index, e.target.value)}
                    placeholder={getContactPlaceholder()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {formData.contact_list.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addContact}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Message Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Message Template
              </label>
              <button
                type="button"
                onClick={useDefaultMessage}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Use Default
              </button>
            </div>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                message_template: e.target.value
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter custom message template..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Available variables: {'{{worker_name}}'}, {'{{overdue_time}}'}, {'{{type}}'}
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                is_active: e.target.checked
              }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Enable this escalation rule
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {rule ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}