import { ArrowRight, CheckCircle, Play, Shield, Smartphone, Wifi, FileText, AlertTriangle, Users } from 'lucide-react'
import { Button } from '@safeping/ui/button'
import { useState } from 'react'
import DemoModal from '../components/DemoModal'

export default function HomePage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-20 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Never Leave Your Lone Workers Truly Alone
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Automated check-ins, instant alerts, and real-time monitoring for remote worker safety
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/signup`}>
                  Start 7-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => setIsDemoModalOpen(true)}>
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-r from-primary-100 to-primary-200 rounded-2xl shadow-2xl h-96 flex items-center justify-center">
              <p className="text-primary-700 font-medium">Worker Mobile App & Admin Dashboard Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Worker App CTA */}
      <section className="bg-primary-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-900">Are you a worker?</h3>
              <p className="text-gray-600">Access the SafePing mobile app to check in and stay safe</p>
            </div>
            <Button variant="outline" size="lg" asChild>
              <a href={import.meta.env.VITE_PWA_URL || 'http://localhost:5174'} target="_blank" rel="noopener noreferrer">
                <Smartphone className="mr-2 h-5 w-5" />
                Open Worker App
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-12 border-y">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 font-medium">Trusted by 500+ companies</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Client Logo</span>
              </div>
            </div>
            <div className="text-center">
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Client Logo</span>
              </div>
            </div>
            <div className="text-center">
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Client Logo</span>
              </div>
            </div>
            <div className="text-center">
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Client Logo</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8 mt-12 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">99.9%</p>
              <p className="text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">2-min</p>
              <p className="text-gray-600">Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-600">Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need for Worker Safety</h2>
            <p className="text-xl text-gray-600">Comprehensive safety monitoring in one simple platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Check-ins</h3>
              <p className="text-gray-600">Schedule regular safety check-ins with customizable intervals and escalation rules</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant SOS Alerts</h3>
              <p className="text-gray-600">One-button emergency alerts that instantly notify supervisors and emergency contacts</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Wifi className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Offline Capability</h3>
              <p className="text-gray-600">Works in remote areas without internet, syncing data when connection returns</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compliance Reports</h3>
              <p className="text-gray-600">Automated OSHA-compliant reporting for audits and insurance requirements</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">Live dashboard showing worker status, locations, and safety metrics</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-level Escalation</h3>
              <p className="text-gray-600">Configurable alert chains ensuring the right people are notified at the right time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How SafePing Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes, not hours</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Set up your team</h3>
              <p className="text-gray-600">Add workers and configure check-in schedules</p>
              <div className="mt-4 bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                <span className="text-gray-500">Screenshot</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Workers check in regularly</h3>
              <p className="text-gray-600">Automated prompts ensure consistent safety checks</p>
              <div className="mt-4 bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                <span className="text-gray-500">Screenshot</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Automatic escalations if needed</h3>
              <p className="text-gray-600">Smart alerts notify the right people at the right time</p>
              <div className="mt-4 bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                <span className="text-gray-500">Screenshot</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete audit trail</h3>
              <p className="text-gray-600">Comprehensive reports for compliance and insights</p>
              <div className="mt-4 bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                <span className="text-gray-500">Screenshot</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Safety Leaders</h2>
            <p className="text-xl text-gray-600">See what our customers have to say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "SafePing has transformed how we manage field worker safety. The automated check-ins give us peace of mind, and the compliance reporting saves hours every month."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">Safety Manager, BuildCo Construction (150 employees)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Our home health nurses work alone in challenging environments. SafePing's offline capability and instant SOS feature have been literal lifesavers."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold">Michael Chen</p>
                  <p className="text-sm text-gray-600">Operations Director, CareFirst Health (75 employees)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The multi-level escalation system ensures issues never fall through the cracks. Setup was incredibly easy - we were monitoring our team within an hour."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold">Emily Rodriguez</p>
                  <p className="text-sm text-gray-600">VP Operations, PowerGrid Utilities (200 employees)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">
              Starting at just <span className="text-primary font-semibold">$4.90/worker/month</span>
            </p>
            <p className="text-lg text-gray-600 mb-8">
              No setup fees. No hidden costs. Cancel anytime.
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/pricing">
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Protect Your Team Today</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join hundreds of companies ensuring their lone workers get home safe every day
            </p>
            <form className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter your work email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                required
              />
              <Button size="lg" variant="secondary" type="submit">
                Get Free Guide
              </Button>
            </form>
            <p className="text-sm text-primary-100 mt-4">
              Download our free "Complete Guide to Lone Worker Safety" PDF
            </p>
          </div>
        </div>
      </section>

      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  )
}
