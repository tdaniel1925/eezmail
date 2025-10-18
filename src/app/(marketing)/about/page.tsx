import Image from 'next/image';
import { Linkedin, Mail } from 'lucide-react';

export const metadata = {
  title: 'About - easeMail by BotMakers, Inc.',
  description: 'Meet the team behind easeMail. Building the future of AI-powered email for enterprises.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="z-10 relative pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both]">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Built by Innovators, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">For Innovators</span>
            </h1>
            <p className="text-lg text-white/70">
              easeMail is created by BotMakers, Inc.—a team dedicated to transforming how professionals work with AI-powered tools.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-12 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-white/70 text-center leading-relaxed">
              To eliminate email overwhelm and give professionals back their most valuable asset: <strong className="text-white">time</strong>. 
              We believe AI should work for humans, not the other way around. easeMail combines cutting-edge technology 
              with thoughtful design to make email a tool for productivity, not a source of stress.
            </p>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">Meet the Founders</h2>
            <p className="text-lg text-white/70">
              Leadership with deep expertise in AI, enterprise software, and user experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Trent T. Daniel */}
            <div className="[animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll">
              <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl overflow-hidden backdrop-blur hover:bg-white/10 transition">
                <div className="aspect-[4/5] relative bg-gradient-to-br from-gray-800 to-gray-900">
                  <Image
                    src="/images/team/trent-daniel.jpg"
                    alt="Trent T. Daniel"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-1">Trent T. Daniel</h3>
                  <p className="text-[#FF4C5A] font-semibold mb-4">Founder & CEO, BotMakers, Inc.</p>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Visionary entrepreneur with a passion for leveraging AI to solve real-world problems. 
                    Trent founded BotMakers with the mission to democratize access to intelligent automation 
                    and create tools that amplify human potential. Under his leadership, easeMail has become 
                    the go-to email platform for productivity-focused teams.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="https://www.linkedin.com/in/trent-daniel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white/60 hover:text-white transition"
                    >
                      <Linkedin className="h-5 w-5" />
                      LinkedIn
                    </a>
                    <a
                      href="mailto:trent@botmakers.com"
                      className="inline-flex items-center gap-2 text-white/60 hover:text-white transition"
                    >
                      <Mail className="h-5 w-5" />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sella Hall */}
            <div className="[animation:fadeSlideIn_0.5s_ease-in-out_0.3s_both] animate-on-scroll">
              <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl overflow-hidden backdrop-blur hover:bg-white/10 transition">
                <div className="aspect-[4/5] relative bg-gradient-to-br from-gray-800 to-gray-900">
                  <Image
                    src="/images/team/sella-hall.jpg"
                    alt="Sella Hall"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-1">Sella Hall</h3>
                  <p className="text-[#FF4C5A] font-semibold mb-4">Chief Experience Officer</p>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Design leader obsessed with creating intuitive, delightful user experiences. 
                    Sella brings a unique blend of empathy and technical expertise to ensure easeMail 
                    not only works brilliantly but feels effortless. Her philosophy: technology should 
                    fade into the background, letting users focus on what matters most.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="https://www.linkedin.com/in/sella-hall"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white/60 hover:text-white transition"
                    >
                      <Linkedin className="h-5 w-5" />
                      LinkedIn
                    </a>
                    <a
                      href="mailto:sella@botmakers.com"
                      className="inline-flex items-center gap-2 text-white/60 hover:text-white transition"
                    >
                      <Mail className="h-5 w-5" />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Privacy First',
                desc: 'Your data is yours. We never scan, sell, or train AI models on your emails. Trust is earned, not assumed.',
              },
              {
                title: 'Speed Matters',
                desc: 'Every millisecond counts. We obsess over performance so you can work at the speed of thought.',
              },
              {
                title: 'AI for Good',
                desc: 'Technology should amplify human capabilities, not replace them. Our AI works for you, on your terms.',
              },
            ].map((value, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 text-center backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-white/60">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="border-gradient before:rounded-2xl bg-gradient-to-br from-[#FF4C5A]/20 to-white/5 rounded-2xl p-12 text-center backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Us on This Journey
            </h2>
            <p className="text-lg text-white/70 mb-8">
              We're building the future of email. Come along for the ride.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF4C5A] hover:bg-[#FF4C5A]/90 text-white font-semibold rounded-full transition"
              >
                Try easeMail
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="mailto:hello@easemail.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition border border-white/20"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

