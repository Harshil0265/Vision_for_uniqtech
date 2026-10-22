/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SignUpButton, SignInButton, useUser } from '@clerk/clerk-react';
import { VisionLogo } from './VisionLogo';
import { useProject } from '../context/ProjectContext';
import { motion } from 'motion/react';
import {
  Layers,
  Rocket,
  BarChart3,
  Zap,
  Users,
  Calendar,
  FolderPlus,
  Clock,
  Paperclip,
  TrendingUp,
  Shield,
  Gauge,
  Sparkles,
  Check,
  Twitter,
  Linkedin,
  Github,
  Star,
  Building2,
  ArrowRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isSignedIn } = useUser();
  const { projects, setIsCreateProjectModalOpen } = useProject();

  // Show welcome screen for authenticated users with no projects
  if (isSignedIn && projects.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <VisionLogo size="lg" showSubtitle={true} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Welcome to Vision
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
              Create your first project to get started with sprint planning, kanban boards, and team collaboration.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
          >
            <FolderPlus className="w-6 h-6" />
            <span>Create Your First Project</span>
          </motion.button>

          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Organize Work</h3>
              <p className="text-sm text-slate-600">Create issues, epics, and tasks with custom workflows.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Collaborate</h3>
              <p className="text-sm text-slate-600">Invite team members and work together in real-time.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Track Progress</h3>
              <p className="text-sm text-slate-600">Monitor velocity, burndown, and team performance.</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white px-6 py-20 md:py-24 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-6xl w-full text-center space-y-8"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <VisionLogo size="lg" showSubtitle={true} />
          </div>

          {/* Social Proof Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30"
          >
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>Trusted by 10,000+ teams worldwide</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight"
          >
            The Enterprise Project Suite
            <br />
            Built for Speed
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
          >
            Kanban boards, sprint planning, roadmaps, and real-time analytics—all in one powerful platform designed for high-velocity teams.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <SignUpButton mode="modal">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </SignUpButton>

            <SignInButton mode="modal">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-blue-700/70 hover:border-white/50 transition-all duration-200 cursor-pointer"
              >
                Sign In
              </motion.button>
            </SignInButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-20 md:py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-center text-slate-900 mb-4">
              Everything you need to ship faster
            </h2>
            <p className="text-center text-slate-600 text-lg md:text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
              Vision combines powerful project management tools with intelligent automation to help your team deliver exceptional results.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Kanban Board */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kanban Board</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Visualize workflow with drag-and-drop cards, custom columns, and real-time updates across your entire team.
              </p>
            </motion.div>

            {/* Sprint Planning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sprint Planning</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Plan sprints with velocity tracking, capacity planning, and burndown charts to keep your team on target.
              </p>
            </motion.div>

            {/* Roadmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Roadmaps</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build strategic roadmaps with timeline views, milestones, and dependencies to align stakeholders.
              </p>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Analytics</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Track team performance with real-time metrics, custom dashboards, and actionable insights.
              </p>
            </motion.div>

            {/* File Attachments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center mb-4">
                <Paperclip className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">File Attachments</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Attach files directly to tasks and issues. Keep all project assets organized in one central location.
              </p>
            </motion.div>

            {/* Due Date Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Due Date Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Set due dates and receive smart reminders. Never miss a deadline with automated notifications.
              </p>
            </motion.div>

            {/* Automation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build custom workflows with triggers, conditions, and actions to eliminate repetitive tasks.
              </p>
            </motion.div>

            {/* Team Collaboration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Team Collaboration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Collaborate with mentions, comments, and notifications to keep everyone in sync.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Why Vision Section */}
      <div className="py-20 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-center text-slate-900 mb-4">
              Why Vision?
            </h2>
            <p className="text-center text-slate-600 text-lg md:text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
              Built for teams that refuse to compromise on speed, scale, or collaboration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Ship 2x Faster */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Gauge className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Ship 2x Faster</h3>
                <p className="text-slate-600 leading-relaxed">
                  Streamline your workflow with intelligent automation and real-time collaboration. Reduce cycle time and ship features at unprecedented velocity. Our customers report doubling their delivery speed within the first quarter.
                </p>
              </div>
            </motion.div>

            {/* One Source of Truth */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">One Source of Truth</h3>
                <p className="text-slate-600 leading-relaxed">
                  Centralize all project data, documentation, and communications in a single platform. No more context switching or lost information. Everything your team needs is right where they need it.
                </p>
              </div>
            </motion.div>

            {/* Built for Scale */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Built for Scale</h3>
                <p className="text-slate-600 leading-relaxed">
                  From startups to enterprises, Vision scales with your team. Handle thousands of projects and unlimited users without compromising performance. Enterprise-grade infrastructure with 99.9% uptime.
                </p>
              </div>
            </motion.div>

            {/* Real-time Collaboration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-time Collaboration</h3>
                <p className="text-slate-600 leading-relaxed">
                  Work together seamlessly with live updates, mentions, and notifications. Everyone stays in sync, automatically. See changes as they happen and respond instantly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 md:py-24 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <div className="text-slate-400 text-sm md:text-base font-medium">Active Users</div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-slate-400 text-sm md:text-base font-medium">Projects Managed</div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-slate-400 text-sm md:text-base font-medium">Uptime</div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
                4.9★
              </div>
              <div className="text-slate-400 text-sm md:text-base font-medium">Average Rating</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 md:py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-center text-slate-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-center text-slate-600 text-lg md:text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
              See what our customers are saying about Vision.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Testimonial 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Vision transformed how our team works. We've cut our sprint planning time in half and delivery speed has doubled. It's simply the best project management tool we've used."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  SJ
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Sarah Johnson</div>
                  <div className="text-sm text-slate-600">Engineering Manager, TechCorp</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "The analytics dashboard gives us real-time insights we never had before. We can spot bottlenecks instantly and make data-driven decisions. Game changer for our product team."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Michael Rodriguez</div>
                  <div className="text-sm text-slate-600">Product Lead, InnovateLabs</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "We migrated from three different tools to Vision. Now everything is in one place and our team collaboration has never been better. The automation features save us hours every week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                  EC
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Emily Chen</div>
                  <div className="text-sm text-slate-600">CTO, StartupHub</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 md:py-24 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams shipping faster with Vision. Get started in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <SignUpButton mode="modal">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-200 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </SignUpButton>
          </div>

          <div className="flex items-center justify-center gap-2 text-blue-100">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">No credit card required</span>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & About */}
            <div className="md:col-span-1">
              <VisionLogo size="sm" showSubtitle={false} />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                The enterprise project management suite built for high-velocity teams.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors duration-200">Testimonials</a></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors duration-200">Roadmap</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#docs" className="hover:text-white transition-colors duration-200">Documentation</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="#support" className="hover:text-white transition-colors duration-200">Support</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm mb-4">
                <li><a href="#about" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
              
              {/* Social Icons */}
              <div className="flex gap-3">
                <a href="#twitter" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors duration-200">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#linkedin" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors duration-200">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#github" aria-label="GitHub" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors duration-200">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Vision Enterprise Suite. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="w-4 h-4" />
              <span>Enterprise-grade security & compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
