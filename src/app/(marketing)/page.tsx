import Link from 'next/link';
import { Sparkles, Zap, Activity, Smile, Clock, Check, ArrowRight, Calendar, Shield } from 'lucide-react';

export const metadata = {
  title: 'easeMail - AI-Powered Email for Enterprises | Save 10 Hours Per Week',
  description:
    'The fastest, most intelligent email client for teams. AI-powered productivity, enterprise security, and 50% less cost than Superhuman. Start your free trial today.',
};

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden" id="hero">
        {/* Decorative grid lines */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* Vertical lines */}
          <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[25%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[50%] w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[75%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[87.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

          {/* Horizontal lines */}
          <div className="absolute inset-x-0 top-[20%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[40%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[60%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[80%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        {/* Background image */}
        <img
          src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/92a4234b-15fa-4d5f-8821-48d3f9f7e2f1_3840w.jpg"
          alt=""
          className="pointer-events-none w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
        />

        {/* Hero Content */}
        <main className="z-10 flex h-[calc(100vh-80px)] relative items-end">
          <section className="md:px-8 md:pb-16 lg:pb-20 w-full max-w-7xl mr-auto ml-auto pr-6 pb-12 pl-6">
            {/* Top divider */}
            <div className="mb-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6 lg:gap-10 gap-x-8 gap-y-8 items-center">
              {/* Column 1: Tag + Headline */}
              <div className="md:col-span-5 lg:col-span-5 relative">
                <div className="inline-flex text-xs font-medium text-white/80 bg-white/5 ring-white/10 ring-1 rounded-full mb-5 pt-1.5 pr-3 pb-1.5 pl-3 backdrop-blur-sm gap-x-2 gap-y-2 items-center">
                  <Sparkles className="h-3.5 w-3.5 text-white/80" />
                  Next-Gen Email Intelligence
                </div>
                <h1 className="leading-tight sm:text-5xl md:text-5xl lg:text-6xl text-4xl tracking-tighter">
                  Transform Your Email Workflow
                  <span className="block bg-clip-text text-transparent tracking-tighter bg-gradient-to-r from-white via-white to-white/70">
                    with AI-Powered Intelligence
                  </span>
                </h1>
              </div>

              {/* Vertical divider */}
              <div className="hidden md:block md:col-span-1 lg:col-span-1 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-white/5 -translate-x-1/2"></div>
              </div>

              {/* Column 2: Description */}
              <div className="md:col-span-4 lg:col-span-3 relative">
                <p className="leading-relaxed md:text-lg text-base text-white/70">
                  We partner with professionals to design, build, and deploy AI-powered email systems that drive
                  measurable productivity gains and save 10+ hours per week.
                </p>
                <div className="border-white/10 border-t mt-6 pt-6">
                  <div className="flex gap-4 text-sm text-white/50 gap-x-4 gap-y-4 items-center">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-400" />
                      <span>Instant semantic search</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden lg:block lg:col-span-1 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-white/5 -translate-x-1/2"></div>
              </div>

              {/* Column 3: Buttons */}
              <div className="md:col-span-12 lg:col-span-2 relative">
                <div className="flex flex-row lg:flex-col gap-x-3 gap-y-3">
                  <Link
                    href="/features"
                    className="inline-flex items-center justify-center gap-2 transition hover:bg-white/15 hover:ring-white/25 whitespace-nowrap text-sm font-medium text-white/90 bg-white/10 ring-white/15 ring-1 rounded-full pt-2.5 pr-4 pb-2.5 pl-4 backdrop-blur-sm"
                  >
                    Try easeMail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 ring-1 ring-white/20 transition hover:bg-neutral-100 whitespace-nowrap text-sm font-medium text-neutral-900 bg-white rounded-full pt-2.5 pr-4 pb-2.5 pl-4"
                  >
                    Start Free Trial
                    <Calendar className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Subtle vignette */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0"></div>
      </div>

      {/* Solutions Section (Stats Cards) */}
      <section className="overflow-hidden lg:py-20 pt-8 pb-8 relative bg-slate-950" id="solutions">
        {/* Decorative grid lines */}
        <div className="pointer-events-none z-0 absolute top-0 right-0 bottom-0 left-0">
          <div className="absolute inset-y-0 left-[15%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[35%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[65%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[85%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[25%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[50%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-[75%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="z-10 md:px-8 flex flex-col h-full max-w-7xl mr-auto ml-auto pr-6 pl-6 relative">
          <div className="flex-1 flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full gap-x-6 gap-y-6">
              {/* Card 1: Real-time metrics */}
              <div className="rounded-3xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 w-fit">
                  <Activity className="w-3.5 h-3.5" />
                  Real-time metrics
                </div>

                <div className="mt-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="md:text-lg leading-relaxed text-base text-slate-300">
                      AI-powered email market projected to grow by
                      <span className="text-orange-300 font-normal"> 59%</span> by 2025
                    </p>

                    {/* Inline trend */}
                    <div className="mt-4 rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
                      <div className="flex gap-2 h-24 gap-x-2 gap-y-2 items-end">
                        <div className="bg-white/10 w-4 rounded" style={{ height: '28px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '46px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '46px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '54px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '64px' }}></div>
                        <div className="bg-orange-400/70 w-4 rounded" style={{ height: '88px' }}></div>
                        <div className="bg-orange-400/80 w-4 rounded" style={{ height: '96px' }}></div>
                        <div className="bg-orange-400/80 w-4 rounded" style={{ height: '96px' }}></div>
                        <div className="bg-orange-400/70 w-4 rounded" style={{ height: '88px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '64px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '54px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '28px' }}></div>
                        <div className="bg-white/10 w-4 rounded" style={{ height: '28px' }}></div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>2021</span>
                        <span>2025</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="text-4xl md:text-5xl font-normal tracking-tighter">$40B</div>
                    <p className="text-slate-400 text-sm mt-1">Expected valuation</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-orange-300" />
                      <span>Forecasted growth trajectory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: AI Email Analysis */}
              <div className="overflow-hidden md:p-4 flex flex-col bg-gradient-to-b from-white/10 to-white/5 h-full ring-white/10 ring-1 rounded-3xl pt-3 pr-3 pb-3 pl-3 relative backdrop-blur-md">
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 flex-1">
                  <img
                    src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/863c6d3d-359c-471a-8fd8-543677b59c4c_800w.webp"
                    alt="Email analysis"
                    className="min-h-[256px] md:min-h-[320px] w-full h-full object-cover"
                  />
                  <div className="absolute top-3 md:top-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-slate-100 text-sm md:text-base font-normal tracking-tighter">98%</span>
                    <span className="text-[11px] md:text-xs text-slate-300/80">Email categorization</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-300"></div>
                      <span className="text-[10px] text-slate-200">Live processing</span>
                    </div>
                  </div>
                </div>

                <div className="relative px-2 md:px-1 pt-4">
                  <h3 className="md:text-xl text-lg font-normal tracking-tighter">AI Email Analysis</h3>
                  <p className="text-sm text-slate-400">Intelligent categorization in milliseconds</p>
                </div>
              </div>

              {/* Card 3: Success Rate */}
              <div className="md:p-6 flex flex-col bg-slate-900/60 ring-white/10 ring-1 rounded-3xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-md h-full">
                <div className="flex items-start justify-between gap-4">
                  <p className="md:text-lg leading-relaxed text-base text-slate-300">
                    With a <span className="text-orange-300 font-normal">75%</span> user satisfaction rate, we help teams
                    process email reliably and efficiently.
                  </p>
                </div>

                <div className="mt-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Delivery outcomes</p>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-slate-300 text-xs">Succeeded</p>
                        <div className="text-2xl md:text-3xl font-normal tracking-tighter">63%</div>
                      </div>
                      <div>
                        <p className="text-slate-300 text-xs">In Progress</p>
                        <div className="text-2xl md:text-3xl font-normal tracking-tighter">24%</div>
                      </div>
                      <div>
                        <p className="text-slate-300 text-xs">Failed</p>
                        <div className="text-2xl md:text-3xl font-normal tracking-tighter">13%</div>
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="mt-5 space-y-3">
                      {/* Success bar */}
                      <div className="relative h-5 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
                        <div className="bg-orange-400/80 absolute top-0 bottom-0 left-0" style={{ width: '63%' }}></div>
                        <div className="absolute left-[63%] -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow"></div>
                      </div>
                      {/* In progress bar */}
                      <div className="relative h-5 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-red-500/80" style={{ width: '24%' }}></div>
                        <div className="absolute left-[24%] -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow"></div>
                      </div>
                      {/* Failed bar */}
                      <div className="relative h-5 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-slate-300/40" style={{ width: '13%' }}></div>
                        <div className="absolute left-[13%] -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 shadow"></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-400">
                      <span className="text-orange-300 font-normal">+12%</span> improvement vs. industry average
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Customer Satisfaction */}
              <div className="rounded-3xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 w-fit">
                  <Smile className="w-3.5 h-3.5" />
                  Customer satisfaction
                </div>

                <div className="mt-4 flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          'conic-gradient(rgba(163,230,53,0.85) 0% 86%, rgba(255,255,255,0.12) 86% 100%)',
                      }}
                    ></div>
                    <div className="absolute inset-2 rounded-full bg-black/20 ring-1 ring-white/10"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-2xl font-normal tracking-tighter">4.8</div>
                    </div>
                  </div>
                  <p className="mt-3 text-slate-400 text-sm">CSAT • last 90 days</p>

                  <div className="mt-6 w-full pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-normal text-slate-300">1,240</div>
                        <p className="text-xs text-slate-400">Responses</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-normal text-slate-300">+0.3</div>
                        <p className="text-xs text-slate-400">vs. Last Period</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Processing Speed */}
              <div className="rounded-3xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 w-fit">
                  <Zap className="w-3.5 h-3.5" />
                  Processing speed
                </div>

                <div className="mt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="md:text-5xl text-4xl font-normal tracking-tighter">14 days</div>
                    <p className="text-slate-400 text-sm">Avg. from signup to mastery</p>

                    <div className="mt-5 grid grid-cols-3 items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-orange-300" />
                        </div>
                        <span className="text-xs text-slate-300">Discovery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-orange-300" />
                        </div>
                        <span className="text-xs text-slate-300">Setup</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-orange-300" />
                        </div>
                        <span className="text-xs text-slate-300">Mastery</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-lg font-normal text-slate-300">98%</div>
                        <p className="text-xs text-slate-400">On-time delivery</p>
                      </div>
                      <div>
                        <div className="text-lg font-normal text-slate-300">24/7</div>
                        <p className="text-xs text-slate-400">Support coverage</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6: Response Latency */}
              <div className="rounded-3xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 w-fit">
                  <Clock className="w-3.5 h-3.5" />
                  AI response time
                </div>

                <div className="mt-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-4xl md:text-5xl font-normal tracking-tighter">120ms</div>
                    <p className="text-slate-400 text-sm">p95 response time</p>

                    {/* Latency meter */}
                    <div className="mt-4">
                      <div className="relative h-3 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400/80 to-red-500/80"
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>0ms</span>
                        <span>200ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-lg font-normal text-slate-300">99.9%</div>
                        <p className="text-xs text-slate-400">Uptime SLA</p>
                      </div>
                      <div>
                        <div className="text-lg font-normal text-slate-300">50ms</div>
                        <p className="text-xs text-slate-400">p50 latency</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logos ticker section */}
          <section className="z-10 fade-in fade-in-delay-4 sm:pb-12 sm:pt-12 pt-8 pb-8 relative animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.5s_both]">
            <div className="sm:px-6 lg:px-8 max-w-7xl mr-auto ml-auto pr-4 pl-4">
              <div className="text-center mb-12">
                <p className="uppercase text-xs font-medium text-zinc-500 tracking-wide">Trusted by teams at</p>
              </div>

              {/* Ticker Container */}
              <div
                className="overflow-hidden relative"
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                }}
              >
                {/* Animated Ticker */}
                <div className="ticker-track flex gap-16 pt-2 pb-2 gap-x-16 gap-y-16 items-center">
                  {/* First set of logos */}
                  <div className="flex gap-16 shrink-0 gap-x-16 gap-y-16 items-center">
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">TechFlow</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-bold tracking-tighter">Nexus Labs</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-semibold tracking-tighter">DataSync</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">VisionCorp</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-semibold tracking-tighter">CloudBase</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">InnovateTech</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-bold tracking-tighter">FlowState</span>
                    </div>
                  </div>

                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center gap-16 shrink-0">
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">TechFlow</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-bold tracking-tighter">Nexus Labs</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-semibold tracking-tighter">DataSync</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">VisionCorp</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-semibold tracking-tighter">CloudBase</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-normal tracking-tighter">InnovateTech</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                      <span className="text-lg font-bold tracking-tighter">FlowState</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Showcase Section */}
      <section
        className="overflow-hidden lg:py-24 bg-[url(https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/d521c037-f8b6-43a7-ae68-c6c1d0215733_3840w.webp)] bg-cover pt-16 pb-16 relative"
        id="showcase"
      >
        {/* Decorative grid lines */}
        <div className="pointer-events-none z-0 absolute inset-0">
          <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        {/* Floating portrait (desktop) */}
        <div className="hidden lg:block absolute right-8 top-10 z-10">
          <div className="rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-sm">
            <img
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/20253914-1507-436f-a56d-f7abbc5d0c73_800w.webp"
              alt="Team portrait"
              className="w-48 h-36 object-cover"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Product Specialist</p>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 gap-x-8 gap-y-8 items-center">
            {/* Large visual */}
            <div className="lg:col-span-7">
              <div className="aspect-[16/11] md:aspect-[5/4] overflow-hidden rounded-3xl relative">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/2bad1237-d4b7-4abc-a4ff-4bb6e105b47d_1600w.png"
                  alt="Email systems visual"
                  className="[animation:parallaxElement_linear_both] [animation-timeline:view()] [animation-range:entry_0%_entry_100%] w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Copy */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.05s_both] w-fit">
                Point of view
              </div>

              <h2 className="animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.15s_both] sm:text-5xl md:text-6xl md:font-normal md:tracking-tighter text-4xl font-semibold tracking-tight mt-4">
                Email Intelligence, Engineered with Precision
              </h2>

              <p className="md:mt-5 md:text-lg leading-relaxed animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.25s_both] text-base text-white/70 mt-5">
                We design production-ready email AI that does more than impress in a demo. From rapid inbox triage to
                mission-critical communications, our systems blend research rigor with product craft to deliver
                measurable impact—safely, reliably, and at scale.
              </p>

              <Link
                href="/features"
                className="group inline-flex items-center gap-2 mt-6 text-sm font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/60 animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.35s_both]"
              >
                Discover our features
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section
        className="overflow-hidden lg:py-24 bg-[url(https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/72c90007-7638-4902-8dda-5a6c20e92741_3840w.jpg)] bg-cover pt-16 pb-16 relative"
        id="resources"
      >
        {/* Decorative grid lines */}
        <div className="pointer-events-none z-0 absolute inset-0">
          <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          {/* Section header */}
          <div className="max-w-3xl">
            <div className="inline-flex text-[11px] ring-1 ring-white/10 animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.05s_both] font-medium text-white/70 bg-white/5 rounded-full pt-1.5 pr-3 pb-1.5 pl-3 gap-x-2 gap-y-2 items-center">
              Key Features
            </div>
            <h2 className="mt-4 sm:text-5xl md:text-6xl text-4xl font-normal tracking-tighter animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.15s_both]">
              Experience AI-Powered Email Excellence
            </h2>
            <p className="md:mt-4 mt-3 md:text-lg text-base text-white/70 leading-relaxed animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.25s_both]">
              Our platform delivers cutting-edge capabilities designed to transform your email workflow with intelligent
              automation and seamless integration.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-10 gap-x-6 gap-y-6">
            {/* Card 1 */}
            <div className="md:p-6 overflow-hidden animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.2s_both] bg-slate-900/50 ring-white/10 ring-1 rounded-3xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-md">
              <h3 className="text-xl md:text-2xl font-normal tracking-tighter">Smart Email Capture</h3>
              <p className="mt-2 text-sm text-slate-400">
                Never miss an important message. Our AI automatically categorizes and prioritizes your most critical
                communications.
              </p>

              {/* Mini email preview UI */}
              <div className="mt-5 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <Activity className="w-4 h-4 opacity-80" />
                    Live categorization
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/5 ring-1 ring-white/10 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300"></div>
                    <span className="text-[10px] text-slate-200">Processing</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] text-slate-300/90">Meeting request from team</div>
                  <div className="text-[11px] text-slate-300/90">Q4 budget review attached</div>
                  <div className="text-[11px] text-slate-300/90">Client follow-up needed</div>
                  <div className="text-[11px] text-slate-300/90">Newsletter digest ready</div>
                </div>
              </div>
            </div>

            {/* Card 2 (highlight) */}
            <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/15 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.28s_both]">
              <div className="absolute inset-0">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/459579f4-e2d0-4218-a12d-f974a4b89651_800w.jpg"
                  alt="Seamless connection"
                  className="opacity-70 w-full h-full object-cover"
                />
                <div className="bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent absolute top-0 right-0 bottom-0 left-0"></div>
              </div>
              <div className="relative p-5 md:p-6">
                <h3 className="text-xl md:text-2xl font-normal tracking-tighter">Effortless Team Coordination</h3>
                <p className="mt-2 text-sm text-slate-200/80">
                  Focus on meaningful work. Spend less time managing email and more time building relationships.
                </p>
              </div>
              <div className="relative p-5 md:p-6 pt-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/80 ring-1 ring-white/15">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto‑summaries & smart insights
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="md:p-6 overflow-hidden animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.36s_both] bg-slate-900/50 ring-white/10 ring-1 rounded-3xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-md">
              <h3 className="text-xl md:text-2xl font-normal tracking-tighter">Email Templates & Rules</h3>
              <p className="mt-2 text-sm text-slate-400">
                Built for professionals who demand flexibility. Our platform adapts to your unique workflow and
                communication style.
              </p>

              {/* Template preview */}
              <div className="mt-5 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),rgba(2,6,23,0.6))] ring-1 ring-white/10 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-sm font-normal text-slate-200">Professional Template</p>
                    <p className="text-[11px] text-slate-400">Comprehensive email automation</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-80" />
                    <span>Auto-schedule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 opacity-80" />
                    <span>Smart reply</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    <span className="text-slate-300">Subject:</span> Automated meeting follow-up
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-slate-300">Action:</span> Send summary and action items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.4s_both] mt-10 gap-x-3 gap-y-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 ring-1 ring-white/20 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 transition"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/15 transition"
            >
              Explore features
              <Sparkles className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/90 underline decoration-white/30 underline-offset-4 hover:decoration-white/60"
            >
              View security details
              <Shield className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="overflow-hidden lg:py-24 pt-16 pb-16 relative" id="pricing">
        {/* Decorative grid lines */}
        <div className="pointer-events-none z-0 absolute inset-0">
          <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="z-10 md:px-8 max-w-7xl mr-auto ml-auto pr-6 pl-6 relative">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex text-[11px] ring-1 ring-white/10 animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.05s_both] font-medium text-white/70 bg-white/5 rounded-full pt-1.5 pr-3 pb-1.5 pl-3 gap-x-2 gap-y-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
              Pricing Plans
            </div>
            <h2 className="mt-4 sm:text-5xl md:text-6xl text-4xl font-normal tracking-tighter animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.15s_both]">
              Choose Your Plan
            </h2>
            <p className="md:mt-4 mt-3 md:text-lg text-base text-white/70 leading-relaxed animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.25s_both]">
              Flexible pricing designed to scale with your business. Start free, upgrade when you&apos;re ready.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Starter Plan */}
            <div className="rounded-3xl bg-slate-900/50 ring-1 ring-white/10 backdrop-blur-md p-6 md:p-8 flex flex-col animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.2s_both]">
              <div className="flex-1">
                <h3 className="text-xl font-normal tracking-tight">Starter</h3>
                <p className="mt-2 text-sm text-slate-400">Perfect for individuals getting started with AI email</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-normal tracking-tighter">$0</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Up to 10 emails processed per day</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Basic AI features</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Standard templates</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/15 transition w-full"
              >
                Get Started
              </Link>
            </div>

            {/* Professional Plan (Featured) */}
            <div className="relative rounded-3xl overflow-hidden ring-2 ring-blue-400/50 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md p-6 md:p-8 flex flex-col animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.28s_both]">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/20 ring-1 ring-blue-400/40 px-2.5 py-1 text-[10px] font-medium text-blue-200">
                  POPULAR
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-normal tracking-tight">Professional</h3>
                <p className="mt-2 text-sm text-slate-200/80">
                  For professionals who need advanced AI features
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-normal tracking-tighter">$49</span>
                    <span className="text-slate-300 text-sm">/month</span>
                  </div>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Unlimited email processing</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Advanced AI (RAG, semantic search)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Custom templates</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white text-neutral-900 ring-1 ring-white/20 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 transition w-full"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-3xl bg-slate-900/50 ring-1 ring-white/10 backdrop-blur-md p-6 md:p-8 flex flex-col animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.36s_both]">
              <div className="flex-1">
                <h3 className="text-xl font-normal tracking-tight">Enterprise</h3>
                <p className="mt-2 text-sm text-slate-400">Custom solutions for large organizations</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-normal tracking-tighter">Custom</span>
                  </div>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>SLA guarantee</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span>On-premise deployment option</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/15 transition w-full"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="overflow-hidden lg:py-24 bg-[url(https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/32b67867-f241-44ab-a57c-c87e60b99c25_3840w.webp)] bg-cover pt-16 pb-16 relative"
        id="start"
      >
        {/* Decorative grid lines */}
        <div className="pointer-events-none z-0 absolute inset-0">
          <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"></div>
          <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="z-10 md:px-8 animate-on-scroll [animation:fadeSlideIn_1s_ease-out_0.1s_both] max-w-7xl mr-auto ml-auto pr-6 pl-6 relative">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 ring-1 ring-white/10 backdrop-blur-md">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative px-6 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ready to get started?
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tighter">
                  Transform Your Email Workflow Today
                </h2>
                <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                  Join thousands of professionals using AI to work smarter with email. Start your free trial now—no
                  credit card required.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-neutral-900 ring-1 ring-white/20 px-6 py-3 text-base font-medium hover:bg-neutral-100 transition"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-6 py-3 text-base font-medium hover:bg-white/15 transition"
                  >
                    Schedule Demo
                    <Calendar className="w-5 h-5" />
                  </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-300" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-300" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-300" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
