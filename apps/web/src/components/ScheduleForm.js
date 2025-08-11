import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
const scheduleSchema = z.object({
    name: z.string().min(1, 'Schedule name is required'),
    description: z.string().optional(),
    frequency: z.enum(['once', 'daily', 'weekly', 'custom']),
    check_in_interval_minutes: z.number().min(15, 'Minimum 15 minutes').max(1440, 'Maximum 24 hours'),
    grace_period_minutes: z.number().min(5, 'Minimum 5 minutes').max(60, 'Maximum 60 minutes'),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    days_of_week: z.array(z.number().min(1).max(7)).optional(),
    is_active: z.boolean().default(true)
});
const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
];
const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Daily', description: 'Check-ins required every day during work hours' },
    { value: 'weekly', label: 'Weekly', description: 'Check-ins required on specific days of the week' },
    { value: 'custom', label: 'Custom', description: 'Custom schedule with specific time ranges' }
];
export function ScheduleForm({ schedule, organizationId, onSubmit, onCancel, loading }) {
    const [selectedDays, setSelectedDays] = useState(schedule?.days_of_week || [1, 2, 3, 4, 5] // Default to weekdays
    );
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            name: schedule?.name || '',
            description: schedule?.description || '',
            frequency: schedule?.frequency || 'daily',
            check_in_interval_minutes: schedule?.check_in_interval_minutes || 60,
            grace_period_minutes: schedule?.grace_period_minutes || 15,
            start_time: schedule?.start_time || '09:00',
            end_time: schedule?.end_time || '17:00',
            days_of_week: schedule?.days_of_week || [1, 2, 3, 4, 5],
            is_active: schedule?.is_active ?? true
        }
    });
    const frequency = watch('frequency');
    const handleDayToggle = (day) => {
        const newDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day].sort();
        setSelectedDays(newDays);
        setValue('days_of_week', newDays);
    };
    const onFormSubmit = async (data) => {
        const scheduleData = {
            ...data,
            organization_id: organizationId,
            days_of_week: selectedDays
        };
        await onSubmit(scheduleData);
    };
    return (_jsx("div", { className: "space-y-6", children: _jsxs("form", { onSubmit: handleSubmit(onFormSubmit), className: "space-y-6", children: [_jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Basic Information" }), _jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Schedule Name" }), _jsx("input", { ...register('name'), type: "text", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "e.g., Day Shift, Security Rounds" }), errors.name && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.name.message }))] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700", children: "Description (Optional)" }), _jsx("textarea", { ...register('description'), rows: 3, className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", placeholder: "Describe when and how this schedule should be used..." })] })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Schedule Frequency" }), _jsx("div", { className: "space-y-4", children: FREQUENCY_OPTIONS.map((option) => (_jsxs("div", { className: "flex items-center", children: [_jsx("input", { ...register('frequency'), id: option.value, type: "radio", value: option.value, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300" }), _jsxs("label", { htmlFor: option.value, className: "ml-3 block", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: option.label }), _jsx("span", { className: "text-sm text-gray-500 block", children: option.description })] })] }, option.value))) }), (frequency === 'weekly' || frequency === 'custom') && (_jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Active Days" }), _jsx("div", { className: "flex flex-wrap gap-2", children: DAYS_OF_WEEK.map((day) => (_jsx("button", { type: "button", onClick: () => handleDayToggle(day.value), className: `px-3 py-2 text-sm rounded-md border ${selectedDays.includes(day.value)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`, children: day.label.slice(0, 3) }, day.value))) })] }))] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Check-in Settings" }), _jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "check_in_interval_minutes", className: "block text-sm font-medium text-gray-700", children: "Check-in Interval (minutes)" }), _jsxs("select", { ...register('check_in_interval_minutes', { valueAsNumber: true }), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", children: [_jsx("option", { value: 15, children: "15 minutes" }), _jsx("option", { value: 30, children: "30 minutes" }), _jsx("option", { value: 60, children: "1 hour" }), _jsx("option", { value: 120, children: "2 hours" }), _jsx("option", { value: 240, children: "4 hours" }), _jsx("option", { value: 480, children: "8 hours" })] }), errors.check_in_interval_minutes && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.check_in_interval_minutes.message }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "grace_period_minutes", className: "block text-sm font-medium text-gray-700", children: "Grace Period (minutes)" }), _jsxs("select", { ...register('grace_period_minutes', { valueAsNumber: true }), className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary", children: [_jsx("option", { value: 5, children: "5 minutes" }), _jsx("option", { value: 10, children: "10 minutes" }), _jsx("option", { value: 15, children: "15 minutes" }), _jsx("option", { value: 30, children: "30 minutes" }), _jsx("option", { value: 60, children: "60 minutes" })] }), errors.grace_period_minutes && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.grace_period_minutes.message }))] }), frequency !== 'once' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "start_time", className: "block text-sm font-medium text-gray-700", children: "Start Time" }), _jsx("input", { ...register('start_time'), type: "time", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "end_time", className: "block text-sm font-medium text-gray-700", children: "End Time" }), _jsx("input", { ...register('end_time'), type: "time", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" })] })] }))] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Schedule Status" }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { ...register('is_active'), id: "is_active", type: "checkbox", className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-gray-900", children: "Schedule is active" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Inactive schedules will not trigger check-in requirements or alerts" })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50", children: loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule' })] })] }) }));
}
