import { FileText, PlayCircle, Download, Calendar, BookOpen, Users } from 'lucide-react'
import { Button } from '@safeping/ui/button'

const guides = [
  {
    title: 'Complete Guide to Lone Worker Safety',
    description: 'Everything you need to know about protecting remote and isolated workers',
    icon: FileText,
    type: 'PDF Guide',
    readTime: '15 min read',
  },
  {
    title: 'OSHA Compliance Checklist',
    description: 'Ensure your lone worker program meets all regulatory requirements',
    icon: FileText,
    type: 'Checklist',
    readTime: '5 min read',
  },
  {
    title: 'Emergency Response Planning',
    description: 'Build effective escalation procedures for worker emergencies',
    icon: FileText,
    type: 'Template',
    readTime: '10 min read',
  },
  {
    title: 'ROI Calculator',
    description: 'Calculate the cost savings of implementing SafePing',
    icon: FileText,
    type: 'Interactive Tool',
    readTime: '3 min',
  },
]

const webinars = [
  {
    title: 'Getting Started with SafePing',
    description: 'Learn how to set up and configure SafePing for your organization',
    date: 'On Demand',
    duration: '30 minutes',
    icon: PlayCircle,
  },
  {
    title: 'Best Practices for Lone Worker Safety',
    description: 'Industry experts share proven strategies for protecting remote workers',
    date: 'Monthly',
    duration: '45 minutes',
    icon: PlayCircle,
  },
  {
    title: 'Advanced Features Deep Dive',
    description: 'Explore API integrations, custom workflows, and enterprise features',
    date: 'Quarterly',
    duration: '60 minutes',
    icon: PlayCircle,
  },
]

const caseStudies = [
  {
    title: 'BuildCo Construction Reduces Incidents by 87%',
    industry: 'Construction',
    size: '250 employees',
    results: '87% reduction in safety incidents',
    icon: Users,
  },
  {
    title: 'CareFirst Health Improves Response Times',
    industry: 'Healthcare',
    size: '150 home health workers',
    results: '92% faster emergency response',
    icon: Users,
  },
  {
    title: 'PowerGrid Utilities Achieves Zero Lost-Time Incidents',
    industry: 'Utilities',
    size: '500 field technicians',
    results: '78% reduction in lost-time incidents',
    icon: Users,
  },
]

const blogPosts = [
  {
    title: 'The Hidden Costs of Workplace Incidents',
    excerpt: 'Beyond medical expenses, workplace incidents carry significant hidden costs that can impact your bottom line...',
    author: 'Sarah Johnson',
    date: 'March 15, 2025',
    category: 'Industry Insights',
  },
  {
    title: '5 Signs Your Organization Needs a Lone Worker Solution',
    excerpt: 'Is your current safety system leaving gaps in protection? Here are the warning signs to watch for...',
    author: 'Mike Chen',
    date: 'March 10, 2025',
    category: 'Best Practices',
  },
  {
    title: 'New OSHA Guidelines for Remote Worker Safety',
    excerpt: 'Recent regulatory updates have expanded employer responsibilities for protecting lone workers...',
    author: 'Lisa Park',
    date: 'March 5, 2025',
    category: 'Compliance',
  },
  {
    title: 'How AI is Revolutionizing Worker Safety',
    excerpt: 'Machine learning and predictive analytics are creating new possibilities for preventing workplace incidents...',
    author: 'David Kim',
    date: 'February 28, 2025',
    category: 'Technology',
  },
]

export default function ResourcesPage() {
  return (
    <div className="py-20">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Resources & Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Expert guidance, industry insights, and practical tools to help you build a world-class safety program
        </p>
      </section>

      {/* Safety Guides */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Safety Guides & Tools</h2>
          <p className="text-xl text-gray-600">Free resources to enhance your safety program</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {guides.map((guide) => (
            <div key={guide.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <guide.icon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm text-gray-500">{guide.readTime}</span>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full mb-3">
                {guide.type}
              </span>
              <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
              <p className="text-gray-600 mb-4">{guide.description}</p>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Free
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Webinars */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Webinars</h2>
            <p className="text-xl text-gray-600">Learn from safety experts and SafePing specialists</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {webinars.map((webinar) => (
              <div key={webinar.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <webinar.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{webinar.title}</h3>
                <p className="text-gray-600 mb-4">{webinar.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {webinar.date}
                  </span>
                  <span>{webinar.duration}</span>
                </div>
                <Button variant="outline" className="w-full">
                  Register Free
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Success Stories</h2>
          <p className="text-xl text-gray-600">See how organizations like yours improved safety with SafePing</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {caseStudies.map((study) => (
            <div key={study.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <study.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{study.title}</h3>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Industry:</span> {study.industry}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {study.size}
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-3 mb-4">
                <p className="text-primary-700 font-semibold">{study.results}</p>
              </div>
              <Button variant="link" className="p-0">
                Read Full Case Study →
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest from the Blog</h2>
            <p className="text-xl text-gray-600">Industry insights and safety best practices</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {blogPosts.map((post) => (
              <article key={post.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs font-medium px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.date}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  <a href="#" className="hover:text-primary-600 transition-colors">
                    {post.title}
                  </a>
                </h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <p className="text-sm text-gray-500">By {post.author}</p>
              </article>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              View All Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated on Worker Safety
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Get the latest safety insights, regulatory updates, and best practices delivered to your inbox
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0"
              required
            />
            <Button variant="secondary" type="submit">
              Subscribe
            </Button>
          </form>
          <p className="text-sm text-primary-100 mt-4">
            Join 5,000+ safety professionals. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  )
}