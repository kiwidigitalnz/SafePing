import { HardHat, Heart, Zap, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@safeping/ui/button'

const industries = [
  {
    id: 'construction',
    icon: HardHat,
    name: 'Construction',
    description: 'Protect workers on job sites, in remote locations, and during hazardous tasks',
    stats: {
      reduction: '87%',
      metric: 'reduction in safety incidents',
    },
    challenges: [
      'Workers spread across multiple job sites',
      'High-risk activities like working at heights',
      'Extreme weather conditions',
      'Remote locations with poor cell coverage',
    ],
    solutions: [
      'Site-specific check-in schedules',
      'Weather alerts and automatic schedule adjustments',
      'Offline mode for remote areas',
      'Equipment-specific safety protocols',
    ],
    testimonial: {
      quote: "SafePing has become an essential part of our safety program. We've seen a dramatic reduction in incidents since implementation.",
      author: 'Mike Thompson',
      role: 'Safety Director, BuildPro Construction',
      company: '250 employees across 15 active sites',
    },
  },
  {
    id: 'healthcare',
    icon: Heart,
    name: 'Healthcare',
    description: 'Ensure the safety of home health workers, community nurses, and mobile care providers',
    stats: {
      reduction: '92%',
      metric: 'faster emergency response time',
    },
    challenges: [
      'Workers entering unfamiliar homes',
      'Potential for aggressive patients',
      'Working alone during night shifts',
      'HIPAA compliance requirements',
    ],
    solutions: [
      'Discreet check-in options',
      'Silent panic alerts',
      'HIPAA-compliant data handling',
      'Integration with scheduling systems',
    ],
    testimonial: {
      quote: "Our nurses feel safer knowing help is just a button press away. The peace of mind is invaluable.",
      author: 'Dr. Sarah Chen',
      role: 'VP of Operations, CareFirst Health',
      company: '150 home health workers',
    },
  },
  {
    id: 'utilities',
    icon: Zap,
    name: 'Utilities & Energy',
    description: 'Monitor field technicians working on critical infrastructure in hazardous conditions',
    stats: {
      reduction: '78%',
      metric: 'reduction in lost-time incidents',
    },
    challenges: [
      'Working with high-voltage equipment',
      'Extreme weather conditions',
      'Remote infrastructure locations',
      'After-hours emergency calls',
    ],
    solutions: [
      'Man-down detection',
      'GPS tracking for remote workers',
      'Integration with dispatch systems',
      'Custom escalation for emergency calls',
    ],
    testimonial: {
      quote: "SafePing's reliability in remote areas has been game-changing for our field operations.",
      author: 'James Rodriguez',
      role: 'Field Operations Manager, PowerGrid Utilities',
      company: '500 field technicians',
    },
  },
  {
    id: 'security',
    icon: Shield,
    name: 'Security',
    description: 'Protect security guards, patrol officers, and lone workers in high-risk environments',
    stats: {
      reduction: '95%',
      metric: 'improvement in response times',
    },
    challenges: [
      'Working alone at night',
      'Potential confrontations',
      'Multiple patrol locations',
      'Need for discreet alerts',
    ],
    solutions: [
      'Silent duress alarms',
      'Patrol checkpoint tracking',
      'Real-time location monitoring',
      'Integration with security systems',
    ],
    testimonial: {
      quote: "The ability to silently call for backup has prevented several dangerous situations from escalating.",
      author: 'Captain Lisa Park',
      role: 'Security Operations Director, SecureGuard',
      company: '300 security officers',
    },
  },
]

export default function IndustriesPage() {
  return (
    <div className="py-20">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Safety Solutions for Every Industry
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          SafePing adapts to your industry's unique challenges, providing tailored safety monitoring that meets your specific needs and compliance requirements.
        </p>
      </section>

      {/* Industry Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {industries.map((industry) => (
            <div
              key={industry.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                  <industry.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold">{industry.name}</h2>
              </div>
              
              <p className="text-gray-600 mb-4">{industry.description}</p>
              
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-3xl font-bold text-primary-600">{industry.stats.reduction}</p>
                <p className="text-sm text-gray-700">{industry.stats.metric}</p>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href={`#${industry.id}`}>
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Industry Sections */}
      {industries.map((industry) => (
        <section
          key={industry.id}
          id={industry.id}
          className={industries.indexOf(industry) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <industry.icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold">{industry.name}</h2>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-4">Common Challenges</h3>
                  <ul className="space-y-3 mb-8">
                    {industry.challenges.map((challenge) => (
                      <li key={challenge} className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span className="text-gray-600">{challenge}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">SafePing Solutions</h3>
                  <ul className="space-y-3">
                    {industry.solutions.map((solution) => (
                      <li key={solution} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-6">"{industry.testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{industry.testimonial.author}</p>
                      <p className="text-sm text-gray-600">{industry.testimonial.role}</p>
                      <p className="text-sm text-gray-600">{industry.testimonial.company}</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-5xl font-bold text-primary-600 mb-2">{industry.stats.reduction}</p>
                    <p className="text-lg text-gray-700">{industry.stats.metric}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            See SafePing in Your Industry
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Get a personalized demo showing how SafePing addresses your industry's specific safety challenges
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href={`${import.meta.env.VITE_WEB_APP_URL || 'https://app.safeping.novaly.app'}/signup`}>
                Start Free Trial
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Schedule Industry Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}