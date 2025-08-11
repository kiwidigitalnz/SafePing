import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

export function TermsOfService() {
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
            <Shield className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">SafePing Terms of Service</h1>
          </div>
          
          <p className="text-sm text-gray-600">Effective Date: 8 November 2025</p>
          <p className="text-sm text-gray-600">Last Updated: 8 November 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and SafePing Limited 
              (a company registered in New Zealand) ("SafePing", "we", "us", or "our") concerning your access to and use 
              of the SafePing application and services.
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using SafePing, you agree to be bound by these Terms. If you disagree with any part of 
              these terms, then you may not access the service.
            </p>
            <p className="text-gray-700 mb-4">
              These Terms comply with the Contract and Commercial Law Act 2017 and other applicable New Zealand legislation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              SafePing provides a workplace safety monitoring platform that includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Automated check-in scheduling for employees</li>
              <li>Emergency alert systems</li>
              <li>Incident escalation protocols</li>
              <li>Real-time safety status monitoring</li>
              <li>Team management and communication tools</li>
              <li>Location-based safety features (with consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Organizations</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use SafePing, you must create an account and provide accurate, complete, and current information. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Organization Administrators</h3>
            <p className="text-gray-700 mb-4">
              Organization administrators have additional responsibilities including managing team members, 
              setting safety protocols, and ensuring compliance with applicable workplace safety regulations.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Age Requirement</h3>
            <p className="text-gray-700 mb-4">
              You must be at least 16 years old to use SafePing, or the minimum age required by your employer 
              and local laws, whichever is higher.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Health and Safety Obligations</h2>
            <p className="text-gray-700 mb-4">
              Under the Health and Safety at Work Act 2015 (New Zealand), employers have duties to ensure workplace 
              safety. SafePing is a tool to assist with these obligations but does not replace legal duties of care.
            </p>
            <p className="text-gray-700 mb-4">
              Users acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>SafePing supplements but does not replace workplace safety procedures</li>
              <li>Emergency services should always be contacted directly in life-threatening situations</li>
              <li>Employers remain responsible for compliance with all applicable safety regulations</li>
              <li>Regular testing and training on safety procedures is essential</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your use of SafePing is also governed by our Privacy Policy, which complies with the Privacy Act 2020 
              (New Zealand). Key points include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>We collect only necessary information for safety monitoring</li>
              <li>Location data is collected only with explicit consent</li>
              <li>Personal information is protected using industry-standard encryption</li>
              <li>Data is stored securely in accordance with New Zealand data protection standards</li>
              <li>You have rights to access, correct, and request deletion of your personal information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use SafePing for any unlawful purpose or in violation of any laws</li>
              <li>Submit false or misleading information</li>
              <li>Impersonate another person or organization</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Use the service to harass, abuse, or harm another person</li>
              <li>Violate the privacy rights of others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription and Payment</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Subscription Plans</h3>
            <p className="text-gray-700 mb-4">
              SafePing offers various subscription tiers. Pricing and features are subject to change with 
              reasonable notice.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Payment Terms</h3>
            <p className="text-gray-700 mb-4">
              All prices are in New Zealand Dollars (NZD) unless otherwise specified. GST is included where applicable. 
              Payment is due in accordance with the selected billing cycle.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Cancellation and Refunds</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time. Refunds are provided in accordance with the 
              Consumer Guarantees Act 1993 where applicable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              SafePing and its original content, features, and functionality are owned by SafePing Limited and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700 mb-4">
              You retain ownership of any content you submit but grant us a license to use it for providing the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by New Zealand law:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>SafePing is provided "as is" without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount paid for the service in the preceding 12 months</li>
              <li>We are not liable for any failure to perform due to circumstances beyond our reasonable control</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Nothing in these Terms excludes or limits liability that cannot be excluded under New Zealand law, 
              including under the Consumer Guarantees Act 1993 for consumers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless SafePing Limited, its officers, directors, employees, and agents 
              from any claims, damages, losses, or expenses arising from your use of the service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Negotiation</h3>
            <p className="text-gray-700 mb-4">
              In the event of a dispute, the parties agree to first attempt resolution through good faith negotiation.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 Mediation</h3>
            <p className="text-gray-700 mb-4">
              If negotiation fails, disputes shall be submitted to mediation in accordance with the Resolution 
              Institute of New Zealand's mediation rules.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">11.3 Jurisdiction</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by New Zealand law. The courts of New Zealand have exclusive jurisdiction 
              over any disputes that cannot be resolved through mediation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. Material changes will be notified via email 
              or through the application at least 30 days before taking effect. Continued use after changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account immediately, without prior notice, for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Breach of these Terms</li>
              <li>Conduct that we believe harms other users or SafePing</li>
              <li>Failure to pay applicable fees</li>
              <li>Extended period of inactivity</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon termination, your right to use the service will cease immediately. Provisions that should 
              survive termination will remain in effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-gray-700">
              <p className="font-semibold">SafePing Limited</p>
              <p>Email: legal@safeping.app</p>
              <p>Phone: 0800 SAFEPING (0800 723 374)</p>
              <p>Address: Level 1, 123 Safety Street, Auckland 1010, New Zealand</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Severability</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be 
              limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain 
              in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Entire Agreement</h2>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy and any other legal notices published by us on the 
              service, constitute the entire agreement between you and SafePing concerning the use of our service.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2025 SafePing Limited. All rights reserved. | Company Number: 1234567 (New Zealand)
          </p>
        </div>
      </div>
    </div>
  )
}
