import { Shield, Smartphone, Users, Bell, MapPin, BarChart3, Wifi, Lock, Clock, Phone, FileText, Zap } from 'lucide-react'
import { Button } from '@safeping/ui/button'

const workerFeatures = [
  {
    icon: Smartphone,
    title: 'Intuitive Mobile App',
    description: 'Easy-to-use interface designed for workers in the field. Available for iOS and Android.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Customizable check-in reminders via push notifications, SMS, or phone calls.',
  },
  {
    icon: Shield,
    title: 'One-Touch SOS',
    description: 'Instant emergency alerts to supervisors and emergency contacts with location data.',
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    description: 'Full functionality in remote areas. Data syncs automatically when connection returns.',
  },
  {
    icon: MapPin,
    title: 'Optional Location Sharing',
    description: 'Share location only during emergencies or continuously for high-risk work.',
  },
  {
    icon: Clock,
    title: 'Flexible Check-ins',
    description: 'Set custom schedules, pause during breaks, and extend time for specific tasks.',
  },
]

const adminFeatures = [
  {
    icon: Users,
    title: 'Team Management',
    description: 'Add workers, assign supervisors, and organize teams by location or project.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Dashboard',
    description: 'Monitor all workers from a single screen with live status updates.',
  },
  {
    icon: Bell,
    title: 'Escalation Management',
    description: 'Configure multi-level alerts and automatic escalation chains.',
  },
  {
    icon: FileText,
    title: 'Compliance Reports',
    description: 'Generate OSHA-compliant reports for audits and insurance requirements.',
  },
  {
    icon: Phone,
    title: 'Two-way Communication',
    description: 'Message workers directly or broadcast updates to entire teams.',
  },
  {
    icon: Lock,
    title: 'Role-based Access',
    description: 'Control who can view, edit, and manage different aspects of the system.',
  },
]

const organizationFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC 2 compliance, and regular security audits.',
  },
  {
    icon: Zap,
    title: 'API Integration',
    description: 'Connect SafePing with your existing HR, scheduling, and safety systems.',
  },
  {
    icon: Users,
    title: 'Multi-site Support',
    description: 'Manage multiple locations with custom settings for each site.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Identify patterns, predict risks, and optimize safety protocols.',
  },
  {
    icon: FileText,
    title: 'Custom Branding',
    description: 'White-label options with your company logo and colors.',
  },
  {
    icon: Phone,
    title: 'Dedicated Support',
    description: '24/7 priority support with dedicated account management for Enterprise.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="py-20">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Powerful Features for Every User
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          From field workers to safety managers to executives, SafePing provides the tools everyone needs to ensure worker safety.
        </p>
      </section>

      {/* Worker Features */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Smartphone className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">For Workers</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, reliable tools that work anywhere - even without internet
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workerFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Features */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">For Administrators</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Complete oversight and control from a powerful dashboard
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {adminFeatures.map((feature) => (
                <div key={feature.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Organization Features */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">For Organizations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade security, compliance, and integration capabilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizationFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              See How SafePing Compares
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Unlike traditional check-in systems, SafePing is built for the modern workforce
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <h3 className="text-6xl font-bold text-primary-400 mb-2">5min</h3>
                <p className="text-gray-300">Setup time</p>
              </div>
              <div>
                <h3 className="text-6xl font-bold text-primary-400 mb-2">99.9%</h3>
                <p className="text-gray-300">Uptime guarantee</p>
              </div>
              <div>
                <h3 className="text-6xl font-bold text-primary-400 mb-2">24/7</h3>
                <p className="text-gray-300">Monitoring & support</p>
              </div>
            </div>

            <Button size="lg" variant="secondary" asChild>
              <a href="/pricing">
                View Pricing Plans
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Experience SafePing in Action
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            See how easy it is to protect your lone workers with our comprehensive safety platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/signup`}>
                Start Free Trial
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Request Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
