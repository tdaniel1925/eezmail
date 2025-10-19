import Link from 'next/link';
import { Mail, MessageSquare, Phone, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Contact Us - easeMail | Get in Touch',
  description:
    'Have questions? Need enterprise support? Contact the easeMail team. We\'re here to help.',
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Get a response within 24 hours',
      value: 'hello@easemail.com',
      link: 'mailto:hello@easemail.com',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Available Mon-Fri, 9am-5pm EST',
      value: 'Start Chat',
      link: '#',
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Enterprise customers only',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'By appointment only',
      value: 'San Francisco, CA',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF4C5A]/10 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Get in{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">
                Touch
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Have questions? Need help getting started? Our team is here to support you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6 text-center hover:ring-white/20 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FF4C5A]/20 transition">
                  <method.icon className="w-6 h-6 text-[#FF4C5A]" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{method.description}</p>
                <p className="text-sm font-medium text-[#FF4C5A]">{method.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Send Us a Message</h2>
              <p className="text-slate-400">We'll get back to you within 24 hours</p>
            </div>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition"
                >
                  <option value="">Select a subject</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="enterprise">Enterprise Plan</option>
                  <option value="security">Security Questions</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full rounded-xl bg-slate-900/60 ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF4C5A] focus:outline-none transition resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-[#FF4C5A] text-white px-8 py-4 text-lg font-semibold hover:bg-[#FF4C5A]/90 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4C5A]/20 to-transparent ring-1 ring-[#FF4C5A]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Have a Quick Question?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Check out our FAQ section—you might find your answer there
            </p>
            <Link
              href="/#faq"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

