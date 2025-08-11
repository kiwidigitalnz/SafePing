import { Check, X } from 'lucide-react'
import { Button } from '@safeping/ui/button'
import { useState } from 'react'
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ')
}

const pricingTiers = [
  {
    name: 'Starter',
    price: '$4.90',
    description: 'Perfect for small teams getting started with lone worker safety',
    workers: 'Up to 10 workers',
    features: [
      { name: 'Automated check-ins', included: true },
      { name: 'SMS & push notifications', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Email support', included: true },
      { name: 'Mobile app (iOS & Android)', included: true },
      { name: 'Offline mode', included: true },
      { name: 'Location tracking', included: false },
      { name: 'API access', included: false },
      { name: 'Custom branding', included: false },
      { name: 'Priority support', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Multi-site management', included: false },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$3.90',
    description: 'Ideal for growing organizations with advanced safety needs',
    workers: '11-50 workers',
    features: [
      { name: 'Automated check-ins', included: true },
      { name: 'SMS & push notifications', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Priority email & chat support', included: true },
      { name: 'Mobile app (iOS & Android)', included: true },
      { name: 'Offline mode', included: true },
      { name: 'Location tracking', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Multi-site management', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Tailored solutions for large organizations with complex requirements',
    workers: '50+ workers',
    features: [
      { name: 'Automated check-ins', included: true },
      { name: 'SMS & push notifications', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Mobile app (iOS & Android)', included: true },
      { name: 'Offline mode', included: true },
      { name: 'Location tracking', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Multi-site management', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No, there are no setup fees or hidden costs. You only pay the monthly per-worker fee.',
  },
  {
    question: 'What happens if I go over my worker limit?',
    answer: 'We\'ll notify you when you\'re approaching your limit. You can easily upgrade to the next tier or pay for additional workers at your current rate.',
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Yes! Annual billing saves you 10% compared to monthly billing. Contact our sales team for annual pricing.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no long-term contracts. You can cancel your subscription at any time with no penalties.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, ACH transfers, and wire transfers for Enterprise customers.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All plans include a 7-day free trial. No credit card required to start.',
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer: 'Yes, we offer a 20% discount for registered non-profit organizations. Contact us with your 501(c)(3) documentation.',
  },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="py-20">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          No setup fees. No hidden costs. Just pay per worker, per month.
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-medium transition-all',
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-medium transition-all',
              billingPeriod === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Annual
            <span className="ml-1 text-xs text-green-600">Save 10%</span>
          </button>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'rounded-2xl border bg-white p-8 shadow-sm relative',
                tier.popular ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
              )}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {tier.price === 'Custom' ? tier.price : (
                      <>
                        {tier.price}
                        <span className="text-lg font-normal text-gray-600">/worker/month</span>
                      </>
                    )}
                  </span>
                  {billingPeriod === 'annual' && tier.price !== 'Custom' && (
                    <p className="text-sm text-green-600 mt-1">
                      {tier.price === '$4.90' ? '$4.41' : '$3.51'}/worker/month billed annually
                    </p>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{tier.description}</p>
                <p className="text-sm font-medium text-gray-900">{tier.workers}</p>
              </div>

              <Button 
                className={cn(
                  'w-full mb-8',
                  tier.popular ? '' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
                )}
                variant={tier.popular ? 'default' : 'outline'}
                asChild
              >
                {tier.name === 'Enterprise' ? (
                  <a href="mailto:sales@safeping.com">
                    {tier.cta}
                  </a>
                ) : (
                  <a href={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/signup?plan=${tier.name.toLowerCase()}`}>
                    {tier.cta}
                  </a>
                )}
              </Button>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
                  What's included
                </h4>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm',
                        feature.included ? 'text-gray-900' : 'text-gray-400'
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            All Plans Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">7-Day Free Trial</h3>
              <p className="text-gray-600">Try SafePing risk-free. No credit card required.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">99.9% Uptime SLA</h3>
              <p className="text-gray-600">Enterprise-grade reliability you can count on.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-gray-600">Your data is secure and privacy is protected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Protect Your Team?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join hundreds of companies keeping their lone workers safe
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/signup`}>
              Start Your Free Trial
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
