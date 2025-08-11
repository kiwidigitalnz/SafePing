import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, UserPlus, Phone, Mail, Shield, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
export default function InviteWorkerPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        role: 'staff',
        sendSMS: true
    });
    const formatPhoneNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format as (XXX) XXX-XXXX
        if (digits.length <= 3) {
            return digits;
        }
        else if (digits.length <= 6) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        }
        else {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }
    };
    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phoneNumber: formatted });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            // Clean phone number for storage
            const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                throw new Error('Please enter a valid 10-digit phone number');
            }
            // Format phone for international
            const formattedPhone = `+1${cleanPhone}`;
            // Create the worker user first
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone_number: formattedPhone,
                email: formData.email || null,
                role: formData.role,
                organization_id: user?.organization_id,
                is_active: false, // Will be activated after they complete onboarding
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (createError)
                throw createError;
            // Create invitation record
            const invitationToken = crypto.randomUUID();
            const { error: inviteError } = await supabase
                .from('worker_invitations')
                .insert({
                user_id: newUser.id,
                organization_id: user?.organization_id,
                invited_by: user?.id,
                invitation_token: invitationToken,
                phone_number: formattedPhone,
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            });
            if (inviteError)
                throw inviteError;
            // Send SMS invitation if requested
            if (formData.sendSMS) {
                const { error: smsError } = await supabase.functions.invoke('send-worker-invitation', {
                    body: {
                        phoneNumber: formattedPhone,
                        invitationToken,
                        workerName: `${formData.firstName} ${formData.lastName}`,
                        organizationName: 'SafePing' // You can fetch org name separately if needed
                    }
                });
                if (smsError) {
                    console.error('SMS send error:', smsError);
                    // Don't throw - invitation was created, just SMS failed
                    setError('Worker invited but SMS failed to send. They can still be added manually.');
                }
            }
            setSuccess(true);
            // Reset form after 2 seconds and navigate back
            setTimeout(() => {
                navigate('/workers');
            }, 2000);
        }
        catch (err) {
            console.error('Error inviting worker:', err);
            setError(err.message || 'Failed to invite worker');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center", children: [_jsx("div", { className: "w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-10 h-10 text-green-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Invitation Sent!" }), _jsxs("p", { className: "text-gray-600 mb-4", children: [formData.firstName, " ", formData.lastName, " has been invited to join SafePing"] }), _jsx("p", { className: "text-sm text-gray-500", children: "Redirecting to workers list..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-2xl mx-auto p-4", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("button", { onClick: () => navigate('/workers'), className: "flex items-center text-gray-600 hover:text-gray-900 mb-4", children: [_jsx(ArrowLeft, { className: "w-5 h-5 mr-2" }), "Back to Workers"] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-[#1A9B9C] rounded-xl flex items-center justify-center", children: _jsx(UserPlus, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Invite Worker" }), _jsx("p", { className: "text-gray-600", children: "Send an invitation to join your organization" })] })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white rounded-2xl shadow-lg p-6 space-y-6", children: [error && (_jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "First Name" }), _jsx("input", { type: "text", required: true, value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent", placeholder: "John" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Last Name" }), _jsx("input", { type: "text", required: true, value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent", placeholder: "Doe" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Phone, { className: "w-4 h-4 inline mr-1" }), "Phone Number (Required)"] }), _jsx("input", { type: "tel", required: true, value: formData.phoneNumber, onChange: handlePhoneChange, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent", placeholder: "(555) 123-4567" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Worker will receive SMS invitation at this number" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Mail, { className: "w-4 h-4 inline mr-1" }), "Email (Optional)"] }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent", placeholder: "john.doe@example.com" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Shield, { className: "w-4 h-4 inline mr-1" }), "Role"] }), _jsxs("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent", children: [_jsx("option", { value: "staff", children: "Staff (Worker)" }), _jsx("option", { value: "admin", children: "Admin (Supervisor)" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Admins can manage workers and view reports" })] }), _jsxs("div", { className: "flex items-center space-x-3 p-4 bg-gray-50 rounded-lg", children: [_jsx("input", { type: "checkbox", id: "sendSMS", checked: formData.sendSMS, onChange: (e) => setFormData({ ...formData, sendSMS: e.target.checked }), className: "w-5 h-5 text-[#1A9B9C] rounded focus:ring-[#1A9B9C]" }), _jsxs("label", { htmlFor: "sendSMS", className: "flex-1", children: [_jsx("span", { className: "font-medium text-gray-900", children: "Send SMS invitation immediately" }), _jsx("p", { className: "text-sm text-gray-600", children: "Worker will receive a text message with download link and setup instructions" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-[#1A9B9C] text-white rounded-lg font-semibold hover:bg-[#158a8b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Sending Invitation..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-5 h-5 mr-2" }), "Send Invitation"] })) })] }), _jsxs("div", { className: "mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-blue-900 mb-2", children: "What happens next?" }), _jsxs("ol", { className: "text-sm text-blue-800 space-y-1 list-decimal list-inside", children: [_jsx("li", { children: "Worker receives SMS with invitation link" }), _jsx("li", { children: "They install the SafePing PWA on their phone" }), _jsx("li", { children: "Complete verification with the code sent to their phone" }), _jsx("li", { children: "Set up their PIN and biometric authentication" }), _jsx("li", { children: "Start using SafePing for check-ins" })] })] })] }) }));
}
