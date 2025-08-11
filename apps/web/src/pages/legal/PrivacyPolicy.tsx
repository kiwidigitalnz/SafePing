import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Lock } from 'lucide-react'

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/auth/signup"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Sign Up
          </Link>
          
          <div className="flex items-center mb-6">
            <Lock className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">SafePing Privacy Policy</h1>
          </div>
          
          <p className="text-sm text-gray-600">Effective Date: 8 November 2025</p>
          <p className="text-sm text-gray-600">Last Updated: 8 November 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              SafePing Limited ("SafePing", "we", "us", or "our") is committed to protecting your privacy and 
              complying with the Privacy Act 2020 (New Zealand) and other applicable privacy laws. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your personal information when you 
              use our workplace safety monitoring application and services.
            </p>
            <p className="text-gray-700 mb-4">
              We are committed to the Privacy Principles set out in the Privacy Act 2020, ensuring that personal 
              information is handled fairly, transparently, and securely.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, organization details</li>
              <li><strong>Profile Information:</strong> Job title, department, emergency contact details</li>
              <li><strong>Safety Information:</strong> Check-in responses, incident reports, safety status updates</li>
              <li><strong>Communication Data:</strong> Messages, alerts, and notifications within the platform</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
              <li><strong>Usage Data:</strong> App features used, time and frequency of use, interaction patterns</li>
              <li><strong>Location Data:</strong> GPS coordinates (only with explicit consent and when necessary for safety features)</li>
              <li><strong>Log Data:</strong> System logs, error reports, performance data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Special Categories of Information</h3>
            <p className="text-gray-700 mb-4">
              In emergency situations, we may process health-related information necessary for ensuring worker safety. 
              This is done only with appropriate consent or where permitted by law for vital interests protection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">
              Under New Zealand privacy law, we collect and process your personal information based on:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Consent:</strong> Where you have given clear consent for processing</li>
              <li><strong>Contract:</strong> Where processing is necessary for our service agreement</li>
              <li><strong>Legal Obligations:</strong> To comply with workplace safety laws and regulations</li>
              <li><strong>Vital Interests:</strong> To protect someone's life or physical safety in emergencies</li>
              <li><strong>Legitimate Interests:</strong> For our legitimate business purposes, balanced against your rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your personal information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide and maintain the SafePing safety monitoring service</li>
              <li>Send safety check-in requests and emergency alerts</li>
              <li>Monitor and respond to safety incidents</li>
              <li>Communicate with you about your account and the service</li>
              <li>Comply with legal obligations under the Health and Safety at Work Act 2015</li>
              <li>Improve our services and develop new features</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Detect, prevent, and address technical issues or security threats</li>
              <li>Generate anonymized analytics and reports for organizations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Within Your Organization</h3>
            <p className="text-gray-700 mb-4">
              Safety information is shared with authorized personnel within your organization, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Designated safety officers and administrators</li>
              <li>Emergency contacts during incidents</li>
              <li>Managers with appropriate permissions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Third-Party Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We may share information with trusted service providers who assist us in operating our service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Cloud hosting providers (data storage)</li>
              <li>Communication service providers (SMS, email notifications)</li>
              <li>Analytics providers (service improvement)</li>
              <li>Payment processors (subscription management)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose information when required by law, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To comply with legal obligations or court orders</li>
              <li>To cooperate with WorkSafe New Zealand investigations</li>
              <li>To protect the rights, property, or safety of SafePing, our users, or others</li>
              <li>In connection with emergency situations threatening life or physical safety</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred. 
              We will provide notice before your information becomes subject to a different privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption of data in transit and at rest using industry-standard protocols</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection and security</li>
              <li>Incident response procedures for potential breaches</li>
              <li>Regular backups and disaster recovery planning</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Despite our efforts, no method of transmission or storage is 100% secure. We cannot guarantee 
              absolute security but commit to notifying you of any breaches as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide our services to you and your organization</li>
              <li>Comply with legal obligations (including workplace safety record requirements)</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Maintain business records for analysis and auditing</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Specific retention periods:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Active account data:</strong> Duration of service plus 30 days</li>
              <li><strong>Safety incident records:</strong> 5 years (as per WorkSafe requirements)</li>
              <li><strong>Check-in logs:</strong> 12 months</li>
              <li><strong>Communication logs:</strong> 6 months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              Under the Privacy Act 2020, you have the following rights:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Right to Access</h3>
            <p className="text-gray-700 mb-4">
              You can request a copy of the personal information we hold about you.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Right to Correction</h3>
            <p className="text-gray-700 mb-4">
              You can request that we correct any inaccurate or incomplete personal information.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.3 Right to Deletion</h3>
            <p className="text-gray-700 mb-4">
              You can request deletion of your personal information, subject to legal obligations.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.4 Right to Object</h3>
            <p className="text-gray-700 mb-4">
              You can object to certain types of processing, including marketing communications.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.5 Right to Data Portability</h3>
            <p className="text-gray-700 mb-4">
              You can request your data in a structured, commonly used, and machine-readable format.
            </p>

            <p className="text-gray-700 mb-4">
              To exercise these rights, contact us at privacy@safeping.app. We will respond within 20 working
              days as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Location Data and Consent</h2>
            <p className="text-gray-700 mb-4">
              Location services are optional and require explicit consent:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Location data is only collected when you enable location-based safety features</li>
              <li>You can withdraw consent at any time through app settings</li>
              <li>Location data is used solely for safety monitoring and emergency response</li>
              <li>We do not track location continuously, only during active check-ins or emergencies</li>
              <li>Location history is retained for the minimum period necessary</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than New Zealand:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>We ensure appropriate safeguards are in place for international transfers</li>
              <li>We only transfer data to countries with adequate privacy protections</li>
              <li>We use standard contractual clauses where necessary</li>
              <li>Primary data storage remains within New Zealand where possible</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              SafePing is not intended for use by individuals under 16 years of age. We do not knowingly collect 
              personal information from children under 16. If we become aware that we have collected information 
              from a child under 16, we will take steps to delete that information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Maintain your session and authentication status</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings. Disabling certain cookies may limit 
              functionality of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Marketing Communications</h2>
            <p className="text-gray-700 mb-4">
              We may send you marketing communications about our services with your consent. You can opt-out at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Clicking the unsubscribe link in any marketing email</li>
              <li>Updating your communication preferences in account settings</li>
              <li>Contacting us at privacy@safeping.app</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Note: We will continue to send essential service communications regardless of marketing preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Posting the new policy on our website and app</li>
              <li>Sending you an email notification</li>
              <li>Displaying a prominent notice in the app</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your continued use of SafePing after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Privacy Officer Contact</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions, concerns, or complaints, contact our Privacy Officer:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-gray-700 mb-4">
              <p className="font-semibold">Privacy Officer</p>
              <p>SafePing Limited</p>
              <p>Email: privacy@safeping.app</p>
              <p>Phone: 0800 SAFEPING (0800 723 374)</p>
              <p>Address: Level 1, 123 Safety Street, Auckland 1010, New Zealand</p>
            </div>
            <p className="text-gray-700 mb-4">
              If you're not satisfied with our response, you can lodge a complaint with the Office of the 
              Privacy Commissioner:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-gray-700">
              <p className="font-semibold">Office of the Privacy Commissioner</p>
              <p>Website: www.privacy.org.nz</p>
              <p>Phone: 0800 803 909</p>
              <p>Email: enquiries@privacy.org.nz</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Breach Notification</h2>
            <p className="text-gray-700 mb-4">
              In the event of a privacy breach that is likely to cause serious harm, we will:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Notify affected individuals as soon as practicable</li>
              <li>Notify the Privacy Commissioner as required by law</li>
              <li>Take immediate steps to contain and remediate the breach</li>
              <li>Provide information about steps you can take to protect yourself</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2025 SafePing Limited. All rights reserved. | Privacy Policy compliant with Privacy Act 2020 (New Zealand)
          </p>
        </div>
      </div>
    </div>
  )
}
