import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';
import { getEscalationRules, deleteEscalationRule, toggleEscalationRule, ESCALATION_LEVELS, CONTACT_METHODS } from '../lib/api/escalations';
import { EscalationRuleForm } from './EscalationRuleForm';
export function EscalationRules({ organizationId }) {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    useEffect(() => {
        loadRules();
    }, [organizationId]);
    const loadRules = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getEscalationRules(organizationId);
            setRules(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load escalation rules');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = () => {
        setEditingRule(null);
        setShowForm(true);
    };
    const handleEdit = (rule) => {
        setEditingRule(rule);
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (deletingId)
            return;
        try {
            setDeletingId(id);
            await deleteEscalationRule(id);
            setRules(rules.filter(rule => rule.id !== id));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete escalation rule');
        }
        finally {
            setDeletingId(null);
        }
    };
    const handleToggle = async (rule) => {
        try {
            const updatedRule = await toggleEscalationRule(rule.id, !rule.is_active);
            setRules(rules.map(r => r.id === rule.id ? updatedRule : r));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update escalation rule');
        }
    };
    const handleFormSubmit = () => {
        setShowForm(false);
        setEditingRule(null);
        loadRules();
    };
    const handleFormCancel = () => {
        setShowForm(false);
        setEditingRule(null);
    };
    const getLevelInfo = (level) => {
        return ESCALATION_LEVELS.find(l => l.value === level) || { label: level, description: '' };
    };
    const getContactMethodInfo = (method) => {
        return CONTACT_METHODS.find(m => m.value === method) || { label: method, description: '' };
    };
    const getContactMethodIcon = (method) => {
        switch (method) {
            case 'sms': return _jsx(MessageSquare, { className: "w-4 h-4" });
            case 'email': return _jsx(Mail, { className: "w-4 h-4" });
            case 'call': return _jsx(Phone, { className: "w-4 h-4" });
            default: return _jsx(MessageSquare, { className: "w-4 h-4" });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-6 bg-gray-200 rounded mb-4" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "h-12 bg-gray-100 rounded" }), _jsx("div", { className: "h-12 bg-gray-100 rounded" }), _jsx("div", { className: "h-12 bg-gray-100 rounded" })] })] }) }));
    }
    return (_jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Escalation Rules" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure automated escalation notifications for overdue check-ins" })] }), _jsxs("button", { onClick: handleCreate, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Rule"] })] }), error && (_jsxs("div", { className: "border border-red-200 bg-red-50 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 mr-2" }), _jsx("span", { className: "text-red-800 font-medium", children: "Error" })] }), _jsx("p", { className: "text-red-700 text-sm mt-1", children: error })] })), rules.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(AlertTriangle, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Escalation Rules" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create escalation rules to automatically notify contacts when workers are overdue." }), _jsxs("button", { onClick: handleCreate, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Your First Rule"] })] })) : (_jsx("div", { className: "space-y-4", children: rules.map((rule) => {
                    const levelInfo = getLevelInfo(rule.level);
                    const methodInfo = getContactMethodInfo(rule.contact_method);
                    return (_jsx("div", { className: `border rounded-lg p-4 ${rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.level === 'emergency'
                                                        ? 'bg-red-100 text-red-800'
                                                        : rule.level === 'level_3'
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : rule.level === 'level_2'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-blue-100 text-blue-800'}`, children: levelInfo.label }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [getContactMethodIcon(rule.contact_method), _jsx("span", { className: "ml-1", children: methodInfo.label })] }), _jsxs("span", { className: "text-sm text-gray-500", children: [rule.delay_minutes, " min delay"] }), _jsxs("span", { className: "text-sm text-gray-500", children: [rule.contact_list.length, " contact", rule.contact_list.length !== 1 ? 's' : ''] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: levelInfo.description }), rule.message_template && (_jsxs("p", { className: "text-sm text-gray-500 italic", children: ["\"", rule.message_template.slice(0, 100), rule.message_template.length > 100 ? '...' : '', "\""] })), _jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: rule.contact_list.map((contact, index) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700", children: contact }, index))) })] }), _jsxs("div", { className: "flex items-center space-x-2 ml-4", children: [_jsx("button", { onClick: () => handleToggle(rule), className: `p-2 rounded-lg ${rule.is_active
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-50'}`, title: rule.is_active ? 'Disable rule' : 'Enable rule', children: rule.is_active ? _jsx(Power, { className: "w-4 h-4" }) : _jsx(PowerOff, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleEdit(rule), className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg", title: "Edit rule", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(rule.id), disabled: deletingId === rule.id, className: "p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50", title: "Delete rule", children: _jsx(Trash2, { className: `w-4 h-4 ${deletingId === rule.id ? 'animate-spin' : ''}` }) })] })] }) }, rule.id));
                }) })), showForm && (_jsx(EscalationRuleForm, { organizationId: organizationId, rule: editingRule, onSubmit: handleFormSubmit, onCancel: handleFormCancel }))] }));
}
