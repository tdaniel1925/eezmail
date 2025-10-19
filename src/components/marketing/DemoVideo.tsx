'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 backdrop-blur-md bg-slate-900/40">
      {/* Video thumbnail / mockup */}
      <div className="aspect-video relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        {!isPlaying ? (
          <>
            {/* Mockup UI */}
            <div className="absolute inset-0 p-8 md:p-12">
              <div className="w-full h-full rounded-2xl bg-slate-950/50 ring-1 ring-white/10 overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-slate-900/80 border-b border-white/10 flex items-center px-6">
                  <div className="w-32 h-8 bg-gradient-to-r from-[#FF4C5A] to-white/20 rounded"></div>
                </div>
                {/* Content area */}
                <div className="flex h-[calc(100%-4rem)]">
                  {/* Sidebar */}
                  <div className="w-64 bg-slate-900/60 border-r border-white/5 p-4 space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-8 bg-slate-800/50 rounded"></div>
                    ))}
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-slate-800/30 rounded-lg"></div>
                    ))}
                  </div>
                  {/* Right sidebar */}
                  <div className="w-80 bg-slate-900/60 border-l border-white/5 p-4">
                    <div className="space-y-3">
                      <div className="h-10 bg-gradient-to-r from-[#FF4C5A]/20 to-transparent rounded"></div>
                      <div className="h-32 bg-slate-800/30 rounded"></div>
                      <div className="h-24 bg-slate-800/30 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute z-10 w-20 h-20 rounded-full bg-[#FF4C5A] flex items-center justify-center hover:bg-[#FF4C5A]/90 transition-all hover:scale-110 ring-8 ring-[#FF4C5A]/20"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </button>

            {/* Animated pulse */}
            <div className="absolute z-0 w-20 h-20 rounded-full bg-[#FF4C5A] animate-ping opacity-20"></div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center">
            <p className="text-slate-400">
              Video demo would be embedded here (YouTube/Vimeo)
            </p>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="p-6 bg-slate-900/80 border-t border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">See easeMail in Action</h3>
            <p className="text-sm text-slate-400">
              Watch how AI transforms your email workflow in under 2 minutes
            </p>
          </div>
          <div className="flex gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              2:15 duration
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              4K quality
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

