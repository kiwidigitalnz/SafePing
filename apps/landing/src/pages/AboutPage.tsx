import { Target, Heart, Shield, Award, TrendingUp } from 'lucide-react'
import { Button } from '@safeping/ui/button'

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'We believe every worker deserves to return home safely. Safety isn\'t just our business—it\'s our mission.',
  },
  {
    icon: Heart,
    title: 'Human-Centered',
    description: 'Technology should empower people, not replace them. We design with empathy and real-world needs in mind.',
  },
  {
    icon: Target,
    title: 'Reliability',
    description: 'When lives are on the line, there\'s no room for error. We\'re committed to 99.9% uptime and beyond.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Innovation',
    description: 'Safety challenges evolve, and so do we. We\'re constantly improving to stay ahead of emerging risks.',
  },
]

const milestones = [
  { year: '2022', event: 'SafePing founded with a mission to eliminate preventable workplace incidents' },
  { year: '2023', event: 'Launched first mobile app and reached 100 customers' },
  { year: '2024', event: 'Expanded to serve 500+ companies across 4 industries' },
  { year: '2025', event: 'Achieved 1 million safe check-ins and counting' },
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Co-founder',
    bio: 'Former safety director with 15 years in construction safety',
    image: '/team/sarah.jpg',
  },
  {
    name: 'Michael Chen',
    role: 'CTO & Co-founder',
    bio: 'Previously led engineering at multiple safety tech startups',
    image: '/team/michael.jpg',
  },
  {
    name: 'Emily Rodriguez',
    role: 'VP of Customer Success',
    bio: '10+ years helping organizations implement safety programs',
    image: '/team/emily.jpg',
  },
  {
    name: 'David Kim',
    role: 'Head of Product',
    bio: 'Product leader passionate about user-centered design',
    image: '/team/david.jpg',
  },
]

const stats = [
  { number: '500+', label: 'Companies Protected' },
  { number: '50,000+', label: 'Workers Monitored' },
  { number: '1M+', label: 'Safe Check-ins' },
  { number: '99.9%', label: 'Uptime' },
]

export default function AboutPage() {
  return (
    <div className="py-20">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Our Mission: Zero Preventable Incidents
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We're building a world where every lone worker has a safety lifeline, 
          no matter where they work or what challenges they face.
        </p>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg mx-auto">
            <p className="text-gray-700 mb-6">
              SafePing was born from a simple observation: while technology has revolutionized how we work, 
              lone worker safety was still stuck in the past. Paper check-ins, buddy systems that didn't scale, 
              and reactive approaches that kicked in only after something went wrong.
            </p>
            <p className="text-gray-700 mb-6">
              Our founders, having experienced the anxiety of managing remote workers and the tragedy of preventable 
              incidents, knew there had to be a better way. They envisioned a system that was proactive, not reactive. 
              Simple enough for any worker to use, yet powerful enough to save lives.
            </p>
            <p className="text-gray-700">
              Today, SafePing protects over 50,000 workers across construction sites, healthcare facilities, 
              utility companies, and security firms. But we're just getting started. Our goal is simple: 
              make preventable workplace incidents a thing of the past.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold text-white mb-2">{stat.number}</p>
                <p className="text-primary-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
          <p className="text-xl text-gray-600">The principles that guide everything we do</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {values.map((value) => (
            <div key={value.title} className="flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <value.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">Building the future of workplace safety</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className="flex items-start mb-8">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full font-bold flex-shrink-0">
                  {milestone.year}
                </div>
                <div className="ml-4 flex-1 pt-4">
                  <p className="text-gray-700">{milestone.event}</p>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-300 ml-8 mt-4"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Leadership Team</h2>
          <p className="text-xl text-gray-600">Experienced professionals dedicated to worker safety</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {team.map((member) => (
            <div key={member.name} className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-primary-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Awards & Recognition</h2>
            <p className="text-xl text-gray-600">Recognized for innovation and impact</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Safety Innovation Award</h3>
              <p className="text-sm text-gray-600">National Safety Council, 2024</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Best Workplace Safety Solution</h3>
              <p className="text-sm text-gray-600">Tech Safety Awards, 2024</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Fast 50 Rising Star</h3>
              <p className="text-sm text-gray-600">Deloitte, 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Our Mission
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Whether you're looking to protect your team or join ours, we'd love to hear from you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href={`${import.meta.env.VITE_WEB_APP_URL || 'https://app.safeping.novaly.app'}/signup`}>
                Start Protecting Workers
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              View Open Positions
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}