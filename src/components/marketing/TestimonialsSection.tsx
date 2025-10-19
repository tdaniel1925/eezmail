'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'CEO',
    company: 'TechCorp',
    image: '/landing/images/team/1.webp',
    quote: 'easeMail has transformed how our team handles communication. We\'ve cut email processing time by 70% and our response rates have never been better.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'VP of Operations',
    company: 'InnovateLabs',
    image: '/landing/images/team/2.webp',
    quote: 'The AI-powered features are game-changing. Smart categorization and instant search have eliminated the chaos from our inbox. Absolutely worth it.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Head of Product',
    company: 'StartupHub',
    image: '/landing/images/team/3.webp',
    quote: 'I was skeptical about switching email clients, but easeMail exceeded all expectations. The productivity boost is real and measurable.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-950 section-dark text-light py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1E40AF] to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4"
          >
            What Our Users Say
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Loved by Professionals Worldwide
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/70 text-lg"
          >
            Join thousands of professionals who have transformed their email workflow with easeMail.
          </motion.p>
        </div>

        {/* Featured Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
            <Quote className="absolute top-6 left-6 w-12 h-12 text-[#1E40AF]/20" />
            <div className="relative z-10">
              <p className="text-2xl md:text-3xl font-medium text-white/90 mb-8 italic leading-relaxed">
                "Artificial intelligence is advancing rapidly, and while it offers immense opportunity, 
                it must be wielded responsibly. Tools like easeMail show how AI can augment human capability 
                without replacing human judgment—that's the future we should build toward."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-bold text-xl">
                  EM
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">Elon Musk</div>
                  <div className="text-white/60">CEO, Tesla & SpaceX</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#1E40AF]/50 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#1E40AF] text-[#1E40AF]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/80 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-white/60 text-sm">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/10"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">50K+</div>
            <div className="text-white/60">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-white/60">User Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">1M+</div>
            <div className="text-white/60">Emails Processed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-white/60">Uptime</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

