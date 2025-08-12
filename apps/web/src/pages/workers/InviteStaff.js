import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, UserPlus, Phone, Mail, Shield, Check, Building, Briefcase, AlertCircle, Users, ChevronDown, Search, User, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
// Country codes data for NZ/AU region
const countryCodesData = [
    { country: 'New Zealand', code: '+64', flag: '🇳🇿' },
    { country: 'Australia', code: '+61', flag: '🇦🇺' },
    { country: 'United States', code: '+1', flag: '🇺🇸' },
    { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { country: 'Canada', code: '+1', flag: '🇨🇦' },
    { country: 'India', code: '+91', flag: '🇮🇳' },
    { country: 'China', code: '+86', flag: '🇨🇳' },
    { country: 'Japan', code: '+81', flag: '🇯🇵' },
    { country: 'South Korea', code: '+82', flag: '🇰🇷' },
    { country: 'Germany', code: '+49', flag: '🇩🇪' },
    { country: 'France', code: '+33', flag: '🇫🇷' },
    { country: 'Italy', code: '+39', flag: '🇮🇹' },
    { country: 'Spain', code: '+34', flag: '🇪🇸' },
    { country: 'Mexico', code: '+52', flag: '🇲🇽' },
    { country: 'Brazil', code: '+55', flag: '🇧🇷' },
    { country: 'Argentina', code: '+54', flag: '🇦🇷' },
    { country: 'South Africa', code: '+27', flag: '🇿🇦' },
    { country: 'Philippines', code: '+63', flag: '🇵🇭' },
    { country: 'Indonesia', code: '+62', flag: '🇮🇩' },
    { country: 'Malaysia', code: '+60', flag: '🇲🇾' },
    { country: 'Singapore', code: '+65', flag: '🇸🇬' },
    { country: 'Thailand', code: '+66', flag: '🇹🇭' },
    { country: 'Vietnam', code: '+84', flag: '🇻🇳' }
];
export default function InviteStaffPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    // Country selector state
    const [selectedCountry, setSelectedCountry] = useState(countryCodesData[0]); // Default to NZ
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        role: 'staff',
        department: '',
        jobTitle: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        sendSMS: true
    });
    const formatPhoneNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format based on length (NZ/AU format)
        if (digits.length <= 2) {
            return digits;
        }
        else if (digits.length <= 5) {
            return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        }
        else if (digits.length <= 8) {
            return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        }
        else {
            return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
        }
    };
    const handlePhoneChange = (e, field) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, [field]: formatted });
    };
    const filteredCountries = countryCodesData.filter(country => country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.includes(countrySearch));
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            // Clean phone number for storage
            const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
            if (cleanPhone.length < 8) {
                throw new Error('Please enter a valid phone number');
            }
            // Format phone with country code
            const formattedPhone = `${selectedCountry.code}${cleanPhone}`;
            // Create the staff member user first
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formattedPhone,
                email: formData.email || null,
                role: formData.role,
                organization_id: user?.organization_id,
                department: formData.department || null,
                job_title: formData.jobTitle || null,
                emergency_contact_name: formData.emergencyContactName || null,
                emergency_contact_phone: formData.emergencyContactPhone ?
                    `${selectedCountry.code}${formData.emergencyContactPhone.replace(/\D/g, '')}` : null,
                is_active: false, // Will be activated after they complete onboarding
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (createError)
                throw createError;
            
            // Create invitation using the database function
            const { data: invitationData, error: inviteError } = await supabase
                .rpc('create_staff_invitation', {
                    p_user_id: newUser.id,
                    p_organization_id: user?.organization_id,
                    p_phone_number: formattedPhone,
                    p_invited_by: user?.id
                });
            
            if (inviteError)
                throw inviteError;
            
            if (!invitationData || invitationData.length === 0) {
                throw new Error('Failed to create invitation');
            }
            
            const invitation = invitationData[0];
            // Send SMS invitation if requested
            if (formData.sendSMS) {
                const { error: smsError } = await supabase.functions.invoke('send-worker-invitation', {
                    body: {
                        phoneNumber: formattedPhone,
                        invitationToken: invitation.invitation_token,
                        workerName: `${formData.firstName} ${formData.lastName}`,
                        organizationName: 'SafePing',
                        verificationCode: invitation.verification_code
                    }
                });
                if (smsError) {
                    console.error('SMS send error:', smsError);
                    // Don't throw - invitation was created, just SMS failed
                    setError('Staff member invited but SMS failed to send. They can still be added manually.');
                }
            }
            setSuccess(true);
            // Reset form after 2 seconds and navigate back
            setTimeout(() => {
                navigate('/staff');
            }, 2000);
        }
        catch (err) {
            console.error('Error inviting staff member:', err);
            setError(err.message || 'Failed to invite staff member');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all animate-fade-in", children: [_jsx("div", { className: "w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-scale", children: _jsx(Check, { className: "w-12 h-12 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-3", children: "Invitation Sent Successfully!" }), _jsxs("p", { className: "text-lg text-gray-600 mb-2", children: [formData.firstName, " ", formData.lastName, " has been invited"] }), _jsx("p", { className: "text-sm text-gray-500 mb-6", children: "They will receive an SMS with instructions to set up their SafePing account" }), _jsxs("div", { className: "flex items-center justify-center space-x-2 text-sm text-gray-400", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '300ms' } }), _jsx("span", { children: "Redirecting to staff list" })] })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", children: [_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("button", { onClick: () => navigate('/staff'), className: "flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group", children: [_jsx(ArrowLeft, { className: "w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" }), "Back to Staff List"] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(UserPlus, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Invite New Staff Member" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Add a new team member to your organization" })] })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-8", children: [error && (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start space-x-3 animate-fade-in", children: [_jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), _jsxs("div", { className: "space-y-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(User, { className: "w-5 h-5 mr-2 text-[#15a2a6]" }), "Personal Information"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "First Name" }), _jsx("input", { type: "text", required: true, value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "John" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Last Name" }), _jsx("input", { type: "text", required: true, value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "Doe" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: [_jsx(Phone, { className: "w-4 h-4 inline mr-1" }), "Phone Number (Required)"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { type: "button", onClick: () => setShowCountryPicker(true), className: "flex items-center space-x-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 transition-colors", children: [_jsx("span", { className: "text-xl", children: selectedCountry.flag }), _jsx("span", { className: "font-medium", children: selectedCountry.code }), _jsx(ChevronDown, { className: "w-4 h-4 text-gray-400" })] }), _jsx("input", { type: "tel", required: true, value: formData.phoneNumber, onChange: (e) => handlePhoneChange(e, 'phoneNumber'), className: "flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "21 234 5678" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Staff member will receive SMS invitation at this number" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: [_jsx(Mail, { className: "w-4 h-4 inline mr-1" }), "Email Address (Optional)"] }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "john.doe@example.com" })] })] }), _jsxs("div", { className: "space-y-6 pt-6 border-t border-gray-100", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Briefcase, { className: "w-5 h-5 mr-2 text-[#15a2a6]" }), "Work Information"] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: [_jsx(Shield, { className: "w-4 h-4 inline mr-1" }), "Role"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("label", { className: `relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.role === 'staff' ? 'border-[#15a2a6] bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`, children: [_jsx("input", { type: "radio", name: "role", value: "staff", checked: formData.role === 'staff', onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "sr-only" }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === 'staff' ? 'border-[#15a2a6] bg-[#15a2a6]' : 'border-gray-300'}`, children: formData.role === 'staff' && _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900", children: "Staff Member" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Can check in, view schedules, and receive safety alerts" })] })] })] }), _jsxs("label", { className: `relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.role === 'admin' ? 'border-[#15a2a6] bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`, children: [_jsx("input", { type: "radio", name: "role", value: "admin", checked: formData.role === 'admin', onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "sr-only" }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === 'admin' ? 'border-[#15a2a6] bg-[#15a2a6]' : 'border-gray-300'}`, children: formData.role === 'admin' && _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900", children: "Administrator" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Can manage staff, view reports, and configure settings" })] })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: [_jsx(Building, { className: "w-4 h-4 inline mr-1" }), "Department (Optional)"] }), _jsx("input", { type: "text", value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "e.g., Field Operations" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: [_jsx(Briefcase, { className: "w-4 h-4 inline mr-1" }), "Job Title (Optional)"] }), _jsx("input", { type: "text", value: formData.jobTitle, onChange: (e) => setFormData({ ...formData, jobTitle: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "e.g., Site Supervisor" })] })] })] }), _jsxs("div", { className: "space-y-6 pt-6 border-t border-gray-100", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Users, { className: "w-5 h-5 mr-2 text-[#15a2a6]" }), "Emergency Contact (Optional)"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Contact Name" }), _jsx("input", { type: "text", value: formData.emergencyContactName, onChange: (e) => setFormData({ ...formData, emergencyContactName: e.target.value }), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "Jane Doe" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Contact Phone" }), _jsx("input", { type: "tel", value: formData.emergencyContactPhone, onChange: (e) => handlePhoneChange(e, 'emergencyContactPhone'), className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all", placeholder: "21 234 5678" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-3 p-5 bg-blue-50 rounded-xl border border-blue-100", children: [_jsx("input", { type: "checkbox", id: "sendSMS", checked: formData.sendSMS, onChange: (e) => setFormData({ ...formData, sendSMS: e.target.checked }), className: "w-5 h-5 text-[#15a2a6] rounded focus:ring-[#15a2a6]" }), _jsxs("label", { htmlFor: "sendSMS", className: "flex-1 cursor-pointer", children: [_jsx("span", { className: "font-semibold text-gray-900", children: "Send SMS invitation immediately" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Staff member will receive a text message with download link and setup instructions" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-4 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform transition-all hover:scale-[1.02] shadow-lg", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" }), "Sending Invitation..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-5 h-5 mr-3" }), "Send Invitation"] })) })] }), _jsxs("div", { className: "mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl", children: [_jsxs("h3", { className: "font-semibold text-blue-900 mb-3 flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 mr-2 text-blue-600" }), "What happens next?"] }), _jsxs("ol", { className: "text-sm text-blue-800 space-y-2 list-decimal list-inside", children: [_jsx("li", { children: "Staff member receives SMS with invitation link" }), _jsx("li", { children: "They install the SafePing app on their phone" }), _jsx("li", { children: "Complete verification with the code sent to their phone" }), _jsx("li", { children: "Set up their PIN and biometric authentication" }), _jsx("li", { children: "Start using SafePing for safety check-ins" })] })] })] }), showCountryPicker && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-end justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: () => {
                            setShowCountryPicker(false);
                            setCountrySearch('');
                        } }), _jsxs("div", { className: "relative w-full max-h-[70vh] bg-white rounded-t-3xl shadow-2xl animate-slide-up", children: [_jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-200 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Select Country" }), _jsx("button", { onClick: () => {
                                                    setShowCountryPicker(false);
                                                    setCountrySearch('');
                                                }, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 20 }), _jsx("input", { type: "text", value: countrySearch, onChange: (e) => setCountrySearch(e.target.value), placeholder: "Search country or code...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#15a2a6] focus:outline-none", autoFocus: true })] })] }), _jsx("div", { className: "overflow-y-auto max-h-[50vh]", children: filteredCountries.map((country) => (_jsxs("button", { onClick: () => {
                                        setSelectedCountry(country);
                                        setShowCountryPicker(false);
                                        setCountrySearch('');
                                    }, className: `w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${selectedCountry.code === country.code && selectedCountry.country === country.country ? 'bg-teal-50' : ''}`, children: [_jsx("span", { className: "text-2xl", children: country.flag }), _jsx("span", { className: "flex-1 text-left text-gray-900", children: country.country }), _jsx("span", { className: "text-gray-500", children: country.code }), selectedCountry.code === country.code && selectedCountry.country === country.country && (_jsx(Check, { className: "text-[#15a2a6]", size: 20 }))] }, country.code + country.country))) })] })] }))] }));
}
