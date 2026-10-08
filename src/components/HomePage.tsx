/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SignUpButton, SignInButton } from '@clerk/clerk-react';
import { VisionLogo } from './VisionLogo';
import {
  Layers,
  Rocket,
  BarChart3,
  Zap,
  Users,
  Calendar
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white px-6 py-16">
        <div className="max-w-5xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <VisionLogo size="lg" showSubtitle={true} />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            The Enterprise Project Suite
            <br />
            Built for Speed
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Kanban boards, sprint planning, roadmaps, and real-time analytics—all in one powerful platform designed for high-velocity teams.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <SignUpButton mode="modal">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer">
                Get Started Free
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-blue-700/70 hover:border-white/50 transition-all duration-200 cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
            Everything you need to ship faster
          </h2>
          <p className="text-center text-slate-600 text-lg mb-12 max-w-2xl mx-auto">
            Vision combines powerful project management tools with intelligent automation to help your team deliver exceptional results.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kanban Board */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kanban Board</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Visualize workflow with drag-and-drop cards, custom columns, and real-time updates across your entire team.
              </p>
            </div>

            {/* Sprint Planning */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sprint Planning</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Plan sprints with velocity tracking, capacity planning, and burndown charts to keep your team on target.
              </p>
            </div>

            {/* Roadmap */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Roadmap</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build strategic roadmaps with timeline views, milestones, and dependencies to align stakeholders.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Track team performance with real-time metrics, custom dashboards, and actionable insights.
              </p>
            </div>

            {/* Automations */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automations</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build custom workflows with triggers, conditions, and actions to eliminate repetitive tasks.
              </p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Team Collaboration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Collaborate with mentions, comments, and notifications to keep everyone in sync.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <VisionLogo size="sm" showSubtitle={false} />
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Vision Enterprise Suite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
