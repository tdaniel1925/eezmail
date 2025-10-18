'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'How is easeMail different from Gmail or Outlook?',
      answer:
        'easeMail is built from the ground up with AI at its core. Unlike Gmail or Outlook which added AI features later, every aspect of easeMail—from search to composition to organization—leverages advanced AI including RAG (Retrieval Augmented Generation), semantic search, and context-aware assistance. We also offer 50% better value than Superhuman at $49/month vs $30/month, with more features.',
    },
    {
      question: 'Do I need to migrate my existing emails?',
      answer:
        'No migration needed! easeMail connects directly to your existing email accounts (Gmail, Outlook, IMAP) and syncs everything automatically. Your emails stay in your current provider—we just make them smarter and faster to manage. Setup takes less than 2 minutes.',
    },
    {
      question: 'Is my data secure and private?',
      answer:
        'Absolutely. We\'re SOC 2 Type II certified and GDPR compliant. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never train AI models on your private emails, never sell your data, and offer on-premise deployment for enterprise customers. Your privacy is our top priority.',
    },
    {
      question: 'Can I try easeMail before committing?',
      answer:
        'Yes! We offer a 14-day free trial with full access to all Professional features—no credit card required. You can also start with our free Starter plan (up to 10 emails processed per day) and upgrade anytime when you\'re ready for more power.',
    },
    {
      question: 'How much time will easeMail actually save me?',
      answer:
        'On average, easeMail users save 10+ hours per week. Our AI handles routine tasks like categorization, drafting replies, and finding information instantly. For a team of 10 processing 50 emails/day each, that translates to 50+ hours saved weekly and over $100K in annual productivity gains.',
    },
    {
      question: 'What AI features are included?',
      answer:
        'easeMail includes semantic search (finds emails by meaning, not just keywords), smart compose (AI writes context-aware drafts), thread summarization, auto-categorization, voice dictation, RAG-powered context that remembers all your email history, and an AI assistant that answers questions about your inbox. All features are included in the Professional plan.',
    },
    {
      question: 'Does easeMail work on mobile?',
      answer:
        'Yes! easeMail works on any device through your web browser. We\'re also developing native iOS and Android apps (coming Q2 2025) with offline mode, push notifications, and the same AI-powered features as the web version.',
    },
    {
      question: 'Can I use easeMail with my team?',
      answer:
        'Absolutely! easeMail offers team features including shared labels, collaborative inbox management, team analytics, and centralized billing. Enterprise customers get SSO/SAML, custom data retention policies, dedicated support, and volume discounts.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-400">
          Everything you need to know about easeMail
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-2xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition"
            >
              <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-6 pt-0">
                <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#FF4C5A]/10 to-transparent ring-1 ring-[#FF4C5A]/20 text-center">
        <p className="text-white font-semibold mb-2">Still have questions?</p>
        <p className="text-slate-400 text-sm mb-4">
          Our team is here to help you get started
        </p>
        <a
          href="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-6 py-2.5 text-sm font-medium hover:bg-white/15 transition"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

