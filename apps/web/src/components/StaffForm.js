import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { User, Phone, Mail, Briefcase, Shield } from 'lucide-react';
export function StaffForm({ staff, organizationId, onSubmit, onCancel, loading }) {
    const [formData, setFormData] = useState({
        first_name: staff?.first_name || '',
        last_name: staff?.last_name || '',
        email: staff?.email || '',
        phone: staff?.phone || '',
        role: staff?.role || 'worker',
        employee_id: staff?.employee_id || '',
        department: staff?.department || '',
        job_title: staff?.job_title || '',
        emergency_contact_name: staff?.emergency_contact_name || '',
        emergency_contact_phone: staff?.emergency_contact_phone || '',
    });
    const [errors, setErrors] = useState({});
    const validateForm = () => {
        const newErrors = {};
        // Required fields
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        // Phone validation (basic format)
        if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        // Emergency contact phone validation
        if (formData.emergency_contact_phone && !/^\+?[\d\s\-()]+$/.test(formData.emergency_contact_phone)) {
            newErrors.emergency_contact_phone = 'Please enter a valid emergency contact phone number';
        }
        // Require either email or phone
        if (!formData.email && !formData.phone) {
            newErrors.contact = 'Either email or phone number is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        try {
            // Clean up the data before submission
            const submitData = {
                ...formData,
                // Convert empty strings to null for optional fields
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                employee_id: formData.employee_id.trim() || null,
                department: formData.department.trim() || null,
                job_title: formData.job_title.trim() || null,
                emergency_contact_name: formData.emergency_contact_name.trim() || null,
                emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
            };
            await onSubmit(submitData);
        }
        catch (error) {
            console.error('Error submitting form:', error);
        }
    };
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    const getRoleOptions = () => [
        { value: 'worker', label: 'Staff Member', description: 'Standard staff member with check-in access' },
        { value: 'supervisor', label: 'Supervisor', description: 'Can manage staff and view reports' },
        { value: 'admin', label: 'Admin', description: 'Full administrative access' },
        { value: 'super_admin', label: 'Super Admin', description: 'Complete system access' },
    ];
    return (_jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: staff ? 'Edit Staff Member' : 'Add New Staff Member' }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: staff ? 'Update staff member information and role permissions.' : 'Create a new staff member account with appropriate role permissions.' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [errors.contact && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-3", children: _jsx("p", { className: "text-sm text-red-600", children: errors.contact }) })), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-4 flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2" }), "Personal Information"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "first_name", className: "block text-sm font-medium text-gray-700", children: "First Name *" }), _jsx("input", { type: "text", id: "first_name", value: formData.first_name, onChange: (e) => handleChange('first_name', e.target.value), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.first_name ? 'border-red-300' : ''}`, placeholder: "Enter first name" }), errors.first_name && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.first_name }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "last_name", className: "block text-sm font-medium text-gray-700", children: "Last Name *" }), _jsx("input", { type: "text", id: "last_name", value: formData.last_name, onChange: (e) => handleChange('last_name', e.target.value), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.last_name ? 'border-red-300' : ''}`, placeholder: "Enter last name" }), errors.last_name && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.last_name }))] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-4 flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Contact Information"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email Address" }), _jsx("input", { type: "email", id: "email", value: formData.email, onChange: (e) => handleChange('email', e.target.value), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.email ? 'border-red-300' : ''}`, placeholder: "Enter email address" }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700", children: "Phone Number" }), _jsx("input", { type: "tel", id: "phone", value: formData.phone, onChange: (e) => handleChange('phone', e.target.value), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.phone ? 'border-red-300' : ''}`, placeholder: "+64 21 123 4567" }), errors.phone && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.phone }))] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-4 flex items-center", children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "Role and Permissions"] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-gray-700 mb-2", children: "User Role" }), _jsx("select", { id: "role", value: formData.role, onChange: (e) => handleChange('role', e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", children: getRoleOptions().map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: getRoleOptions().find(opt => opt.value === formData.role)?.description })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-4 flex items-center", children: [_jsx(Briefcase, { className: "w-4 h-4 mr-2" }), "Work Information"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "employee_id", className: "block text-sm font-medium text-gray-700", children: "Employee ID" }), _jsx("input", { type: "text", id: "employee_id", value: formData.employee_id, onChange: (e) => handleChange('employee_id', e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "Enter employee ID" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "job_title", className: "block text-sm font-medium text-gray-700", children: "Job Title" }), _jsx("input", { type: "text", id: "job_title", value: formData.job_title, onChange: (e) => handleChange('job_title', e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "Enter job title" })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { htmlFor: "department", className: "block text-sm font-medium text-gray-700", children: "Department" }), _jsx("input", { type: "text", id: "department", value: formData.department, onChange: (e) => handleChange('department', e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "Enter department" })] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900 mb-4 flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), "Emergency Contact"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "emergency_contact_name", className: "block text-sm font-medium text-gray-700", children: "Emergency Contact Name" }), _jsx("input", { type: "text", id: "emergency_contact_name", value: formData.emergency_contact_name, onChange: (e) => handleChange('emergency_contact_name', e.target.value), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "Enter emergency contact name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "emergency_contact_phone", className: "block text-sm font-medium text-gray-700", children: "Emergency Contact Phone" }), _jsx("input", { type: "tel", id: "emergency_contact_phone", value: formData.emergency_contact_phone, onChange: (e) => handleChange('emergency_contact_phone', e.target.value), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.emergency_contact_phone ? 'border-red-300' : ''}`, placeholder: "+64 21 123 4567" }), errors.emergency_contact_phone && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.emergency_contact_phone }))] })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-6 border-t border-gray-200", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" }), staff ? 'Updating...' : 'Creating...'] })) : (staff ? 'Update Staff Member' : 'Create Staff Member') })] })] })] }));
}
