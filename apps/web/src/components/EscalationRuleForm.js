import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { createEscalationRule, updateEscalationRule, validateEscalationRule, ESCALATION_LEVELS, CONTACT_METHODS } from '../lib/api/escalations';
import { getSchedules } from '../lib/api/schedules';
export function EscalationRuleForm({ organizationId, rule, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        level: 'level_1',
        delay_minutes: 5,
        contact_method: 'sms',
        contact_list: [''],
        message_template: '',
        schedule_id: null,
        is_active: true
    });
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    useEffect(() => {
        loadSchedules();
        if (rule) {
            setFormData({
                level: rule.level,
                delay_minutes: rule.delay_minutes,
                contact_method: rule.contact_method,
                contact_list: rule.contact_list.length > 0 ? rule.contact_list : [''],
                message_template: rule.message_template || '',
                schedule_id: rule.schedule_id,
                is_active: rule.is_active
            });
        }
    }, [rule]);
    const loadSchedules = async () => {
        try {
            const data = await getSchedules(organizationId);
            setSchedules(data);
        }
        catch (err) {
            console.error('Failed to load schedules:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setValidationErrors([]);
        // Filter out empty contacts
        const cleanedContacts = formData.contact_list.filter(contact => contact.trim() !== '');
        const dataToValidate = {
            organization_id: organizationId,
            schedule_id: formData.schedule_id,
            level: formData.level,
            delay_minutes: formData.delay_minutes,
            contact_method: formData.contact_method,
            contact_list: cleanedContacts,
            message_template: formData.message_template || null,
            is_active: formData.is_active
        };
        const validation = validateEscalationRule(dataToValidate);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            return;
        }
        try {
            setLoading(true);
            if (rule) {
                await updateEscalationRule(rule.id, {
                    level: formData.level,
                    delay_minutes: formData.delay_minutes,
                    contact_method: formData.contact_method,
                    contact_list: cleanedContacts,
                    message_template: formData.message_template || null,
                    is_active: formData.is_active
                });
            }
            else {
                await createEscalationRule({
                    organization_id: organizationId,
                    schedule_id: formData.schedule_id,
                    level: formData.level,
                    delay_minutes: formData.delay_minutes,
                    contact_method: formData.contact_method,
                    contact_list: cleanedContacts,
                    message_template: formData.message_template || null,
                    is_active: formData.is_active
                });
            }
            onSubmit();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save escalation rule');
        }
        finally {
            setLoading(false);
        }
    };
    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contact_list: [...prev.contact_list, '']
        }));
    };
    const removeContact = (index) => {
        setFormData(prev => ({
            ...prev,
            contact_list: prev.contact_list.filter((_, i) => i !== index)
        }));
    };
    const updateContact = (index, value) => {
        setFormData(prev => ({
            ...prev,
            contact_list: prev.contact_list.map((contact, i) => i === index ? value : contact)
        }));
    };
    const getContactPlaceholder = () => {
        switch (formData.contact_method) {
            case 'sms':
            case 'call':
                return '+64021234567';
            case 'email':
                return 'supervisor@company.com';
            default:
                return '';
        }
    };
    const getDefaultMessage = () => {
        const workerName = '{{worker_name}}';
        const overdueTime = '{{overdue_time}}';
        switch (formData.level) {
            case 'level_1':
                return `SAFETY ALERT: ${workerName} is ${overdueTime} overdue for check-in. Please verify their safety immediately.`;
            case 'level_2':
                return `URGENT: ${workerName} has been overdue for ${overdueTime}. Escalating to management. Please take immediate action.`;
            case 'level_3':
                return `EMERGENCY: ${workerName} has been missing for ${overdueTime}. Emergency response may be required.`;
            case 'emergency':
                return `CRITICAL: ${workerName} has been missing for ${overdueTime}. All emergency protocols activated.`;
            default:
                return '';
        }
    };
    const useDefaultMessage = () => {
        setFormData(prev => ({
            ...prev,
            message_template: getDefaultMessage()
        }));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: rule ? 'Edit Escalation Rule' : 'Create Escalation Rule' }), _jsx("button", { onClick: onCancel, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [validationErrors.length > 0 && (_jsxs("div", { className: "border border-red-200 bg-red-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 mr-2" }), _jsx("span", { className: "text-red-800 font-medium", children: "Validation Errors" })] }), _jsx("ul", { className: "text-red-700 text-sm space-y-1", children: validationErrors.map((error, index) => (_jsxs("li", { children: ["\u2022 ", error] }, index))) })] })), error && (_jsxs("div", { className: "border border-red-200 bg-red-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 mr-2" }), _jsx("span", { className: "text-red-800 font-medium", children: "Error" })] }), _jsx("p", { className: "text-red-700 text-sm mt-1", children: error })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Apply To Schedule" }), _jsxs("select", { value: formData.schedule_id || '', onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        schedule_id: e.target.value || null
                                    })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "All Schedules (Global Rule)" }), schedules.map(schedule => (_jsx("option", { value: schedule.id, children: schedule.name }, schedule.id)))] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Leave blank to apply this rule to all schedules" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Escalation Level" }), _jsx("select", { value: formData.level, onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        level: e.target.value
                                    })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", required: true, children: ESCALATION_LEVELS.map(level => (_jsxs("option", { value: level.value, children: [level.label, " - ", level.description] }, level.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Trigger After (minutes overdue)" }), _jsx("input", { type: "number", min: "0", value: formData.delay_minutes, onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        delay_minutes: parseInt(e.target.value) || 0
                                    })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", required: true }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "How many minutes after the grace period expires should this escalation trigger" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Contact Method" }), _jsx("select", { value: formData.contact_method, onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        contact_method: e.target.value
                                    })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", required: true, children: CONTACT_METHODS.map(method => (_jsxs("option", { value: method.value, children: [method.label, " - ", method.description] }, method.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Contact List" }), _jsxs("div", { className: "space-y-2", children: [formData.contact_list.map((contact, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "text", value: contact, onChange: (e) => updateContact(index, e.target.value), placeholder: getContactPlaceholder(), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" }), formData.contact_list.length > 1 && (_jsx("button", { type: "button", onClick: () => removeContact(index), className: "p-2 text-red-600 hover:bg-red-50 rounded-md", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] }, index))), _jsxs("button", { type: "button", onClick: addContact, className: "inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Contact"] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Message Template" }), _jsx("button", { type: "button", onClick: useDefaultMessage, className: "text-sm text-blue-600 hover:text-blue-800", children: "Use Default" })] }), _jsx("textarea", { value: formData.message_template, onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        message_template: e.target.value
                                    })), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Enter custom message template..." }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Available variables: ", '{{worker_name}}', ", ", '{{overdue_time}}', ", ", '{{type}}'] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => setFormData(prev => ({
                                        ...prev,
                                        is_active: e.target.checked
                                    })), className: "rounded border-gray-300 text-primary focus:ring-primary" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 text-sm text-gray-700", children: "Enable this escalation rule" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-6 border-t", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), rule ? 'Update Rule' : 'Create Rule'] })) })] })] })] }) }));
}
