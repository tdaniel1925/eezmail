'use client';

import { useState } from 'react';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';

export function ROICalculator() {
  const [teamSize, setTeamSize] = useState(10);
  const [emailsPerDay, setEmailsPerDay] = useState(50);

  // Calculate savings
  const timePerEmailMinutes = 2; // Average time spent per email
  const timeSavedPercentage = 0.4; // 40% time savings with AI
  
  const totalEmailsPerDay = teamSize * emailsPerDay;
  const minutesPerDay = totalEmailsPerDay * timePerEmailMinutes;
  const minutesSavedPerDay = minutesPerDay * timeSavedPercentage;
  const hoursSavedPerDay = minutesSavedPerDay / 60;
  const hoursSavedPerWeek = hoursSavedPerDay * 5;
  const hoursSavedPerYear = hoursSavedPerWeek * 52;
  
  const avgHourlyRate = 50; // Average employee hourly rate
  const costSavingsPerYear = hoursSavedPerYear * avgHourlyRate;
  const easemailCostPerYear = teamSize * 49 * 12; // $49/user/month
  const netSavings = costSavingsPerYear - easemailCostPerYear;
  const roi = ((netSavings / easemailCostPerYear) * 100).toFixed(0);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 ring-1 ring-white/10 backdrop-blur-md p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1E40AF]/10 ring-1 ring-[#1E40AF]/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[#1E40AF]" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">ROI Calculator</h3>
          <p className="text-sm text-slate-400">See your potential savings with easeMail</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Team Size: <span className="text-white">{teamSize} people</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={teamSize}
            onChange={(e) => setTeamSize(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-[#1E40AF]"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Emails per person per day: <span className="text-white">{emailsPerDay}</span>
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={emailsPerDay}
            onChange={(e) => setEmailsPerDay(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-[#1E40AF]"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10</span>
            <span>100</span>
            <span>200</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-black/20 rounded-2xl ring-1 ring-white/5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#1E40AF]" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Time Saved</span>
          </div>
          <div className="text-3xl font-bold text-white">{hoursSavedPerWeek.toFixed(0)}</div>
          <div className="text-sm text-slate-400 mt-1">hours per week</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Annual Savings</span>
          </div>
          <div className="text-3xl font-bold text-green-400">
            ${(netSavings / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-slate-400 mt-1">net savings</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">ROI</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{roi}%</div>
          <div className="text-sm text-slate-400 mt-1">return on investment</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-[#1E40AF]/10 ring-1 ring-[#1E40AF]/20 rounded-xl">
        <p className="text-sm text-slate-300 text-center">
          Your team could save <span className="text-white font-semibold">{hoursSavedPerYear.toFixed(0)} hours</span> and{' '}
          <span className="text-white font-semibold">${(netSavings / 1000).toFixed(1)}K</span> annually with easeMail
        </p>
      </div>
    </div>
  );
}

