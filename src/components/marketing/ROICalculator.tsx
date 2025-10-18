'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { AnimatedButton } from './AnimatedButton';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ROICalculator() {
  const [teamSize, setTeamSize] = useState([10]);
  const [emailsPerDay, setEmailsPerDay] = useState([50]);
  const [timePerEmail, setTimePerEmail] = useState(2); // minutes

  // Calculate savings
  const totalEmailsPerDay = teamSize[0] * emailsPerDay[0];
  const minutesPerDay = totalEmailsPerDay * timePerEmail;
  const minutesSaved = minutesPerDay * 0.5; // 50% time savings with easeMail
  const hoursSavedPerWeek = (minutesSaved * 5) / 60;
  const dollarValuePerWeek = hoursSavedPerWeek * 50; // $50/hour rate
  const annualSavings = dollarValuePerWeek * 52;

  return (
    <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          Calculate Your Time Savings
        </h3>
        <p className="text-white/70 text-sm">
          See how much time and money your team can save with easeMail's AI-powered productivity features.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Team Size */}
        <div>
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Team Size</label>
            <span className="text-sm font-semibold text-[#FF4C5A]">{teamSize[0]} people</span>
          </div>
          <Slider
            value={teamSize}
            onValueChange={setTeamSize}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Emails Per Day */}
        <div>
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Emails per person/day</label>
            <span className="text-sm font-semibold text-[#FF4C5A]">{emailsPerDay[0]} emails</span>
          </div>
          <Slider
            value={emailsPerDay}
            onValueChange={setEmailsPerDay}
            max={200}
            min={10}
            step={10}
            className="w-full"
          />
        </div>

        {/* Time Per Email */}
        <div>
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Avg time per email</label>
            <span className="text-sm font-semibold text-[#FF4C5A]">{timePerEmail} min</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5].map((min) => (
              <button
                key={min}
                onClick={() => setTimePerEmail(min)}
                className={`py-2 rounded-lg text-sm font-medium transition ${
                  timePerEmail === min
                    ? 'bg-[#FF4C5A] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="border-t border-white/10 pt-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 border-gradient before:rounded-xl">
            <p className="text-xs text-white/60 mb-1">Hours Saved/Week</p>
            <p className="text-3xl font-bold text-white">
              {hoursSavedPerWeek.toFixed(1)}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border-gradient before:rounded-xl">
            <p className="text-xs text-white/60 mb-1">Value Saved/Week</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${dollarValuePerWeek.toFixed(0)}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border-gradient before:rounded-xl">
            <p className="text-xs text-white/60 mb-1">Annual Savings</p>
            <p className="text-3xl font-bold text-[#FF4C5A]">
              ${(annualSavings / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>

      <Link href="/signup">
        <AnimatedButton className="w-full justify-center">
          Start Saving Time Today
          <ArrowRight className="h-4 w-4" />
        </AnimatedButton>
      </Link>

      <p className="text-xs text-white/50 text-center mt-4">
        * Based on 50% reduction in email processing time
      </p>
    </div>
  );
}

