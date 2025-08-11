import { Search, Book, Video, MessageCircle, Mail, Phone, Clock, AlertCircle, HelpCircle, FileText, Zap, Settings } from 'lucide-react'
import { Button } from '@safeping/ui/button'

const quickLinks = [
  {
    icon: Zap,
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    link: '#',
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Step-by-step visual guides',
    link: '#',
  },
  {
    icon: Book,
    title: 'Documentation',
    description: 'Comprehensive user guides',
    link: '#',
  },
  {
    icon: Settings,
    title: 'API Reference',
    description: 'Technical integration docs',
    link: '#',
  },
]

const popularArticles = [
  {
    category: 'Getting Started',
    articles: [
      'How to add your first worker',
      'Setting up check-in schedules',
      'Configuring escalation chains',
      'Understanding the dashboard',
    ],
  },
  {
    category: 'Mobile App',
    articles: [
      'Downloading and installing the app',
      'Worker app walkthrough',
      'Troubleshooting connectivity issues',
      'Managing app permissions',
    ],
  },
  {
    category: 'Administration',
    articles: [
      'Managing user roles and permissions',
      'Generating compliance reports',
      'Customizing notification settings',
      'Bulk importing workers',
    ],
  },
  {
    category: 'Troubleshooting',
    articles: [
      'Worker not receiving notifications',
      'Check-in not registering',
      'Login issues and password reset',
      'Syncing problems in offline mode',
    ],
  },
]

const contactOptions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    availability: 'Available 24/7',
    cta: 'Start Chat',
    priority: true,
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email',
    availability: 'Response within 24 hours',
    cta: 'Send Email',
    email: 'support@safeping.com',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak with a specialist',
    availability: 'Mon-Fri 8am-6pm EST',
    cta: 'Call Now',
    phone: '1-800-SAFEPING',
  },
]

export default function SupportPage() {
  return (
    <div className="py-20">
      {/* Header with Search */}
      <section className="bg-gradient-to-b from-gray-50 to-white pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers, watch tutorials, or contact our support team
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search for articles, guides, or topics..."
              className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <link.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{link.title}</h3>
              <p className="text-gray-600 text-sm">{link.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Help Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {popularArticles.map((category) => (
              <div key={category.category} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-primary-600 mr-2" />
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline">
              Browse All Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-xl text-gray-600">Our support team is here to assist you</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {contactOptions.map((option) => (
            <div
              key={option.title}
              className={`bg-white rounded-lg shadow-sm border ${
                option.priority ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50' : 'border-gray-200'
              } p-6 text-center`}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <option.icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
              <p className="text-gray-600 mb-2">{option.description}</p>
              <p className="text-sm text-gray-500 mb-4 flex items-center justify-center">
                <Clock className="h-4 w-4 mr-1" />
                {option.availability}
              </p>
              {option.email ? (
                <Button variant={option.priority ? 'default' : 'outline'} asChild>
                  <a href={`mailto:${option.email}`}>{option.cta}</a>
                </Button>
              ) : option.phone ? (
                <Button variant={option.priority ? 'default' : 'outline'} asChild>
                  <a href={`tel:${option.phone.replace(/\D/g, '')}`}>{option.cta}</a>
                </Button>
              ) : (
                <Button variant={option.priority ? 'default' : 'outline'}>{option.cta}</Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* System Status */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <h3 className="text-xl font-semibold">All Systems Operational</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Current system status and uptime information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium">API Status</p>
                  <p className="text-green-600">Operational</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium">Mobile Apps</p>
                  <p className="text-green-600">Operational</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium">SMS Service</p>
                  <p className="text-green-600">Operational</p>
                </div>
              </div>
              <Button variant="link" className="mt-4">
                View Full Status Page →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary-50 rounded-2xl p-8 text-center">
          <HelpCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Find quick answers to common questions about features, billing, security, and more
          </p>
          <Button variant="outline" asChild>
            <a href="/pricing#faq">View All FAQs</a>
          </Button>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="bg-red-50 border-t-4 border-red-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <AlertCircle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Emergency Support</h3>
                <p className="text-gray-700">For urgent safety issues, call our 24/7 emergency line</p>
              </div>
            </div>
            <Button variant="destructive" size="lg" asChild>
              <a href="tel:18007233746">
                <Phone className="mr-2 h-5 w-5" />
                1-800-SAFEPNG
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}