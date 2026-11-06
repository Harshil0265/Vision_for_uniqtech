/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform
} from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Kanban,
  KeyRound,
  Layers,
  Lock,
  MailCheck,
  Paperclip,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users
} from 'lucide-react';
import { VisionLogo } from './VisionLogo';

interface HomePageProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

/** Fades and lifts its children into view once, when scrolled to. Respects reduced-motion. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const CountUp: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration: 1.6, ease: EASE, onUpdate: v => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return <span ref={ref}>{value}{suffix}</span>;
};

const SectionHeading: React.FC<{ eyebrow: string; title: React.ReactNode; body?: string; light?: boolean }> = ({ eyebrow, title, body, light }) => (
  <Reveal className="max-w-2xl mx-auto text-center">
    <div className={`text-xs font-semibold tracking-[0.22em] uppercase ${light ? 'text-amber-300/90' : 'text-amber-700'}`}>{eyebrow}</div>
    <h2 className={`font-display text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] mt-3 ${light ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
    {body && <p className={`mt-4 text-base sm:text-lg leading-relaxed ${light ? 'text-slate-300' : 'text-slate-600'}`}>{body}</p>}
  </Reveal>
);

// ---------------------------------------------------------------------------
// Hero product mockup: a live-looking board where a card keeps moving to Done
// ---------------------------------------------------------------------------

interface MockCard { id: string; key: string; title: string; tag: string; tagClass: string; points: number }

const CARDS: MockCard[] = [
  { id: 'a', key: 'OP-142', title: 'Rotate refresh tokens on every use', tag: 'Security', tagClass: 'bg-rose-50 text-rose-700', points: 5 },
  { id: 'b', key: 'OP-138', title: 'Sprint velocity chart', tag: 'Analytics', tagClass: 'bg-violet-50 text-violet-700', points: 3 },
  { id: 'c', key: 'OP-151', title: 'Invite flow by email', tag: 'Feature', tagClass: 'bg-blue-50 text-blue-700', points: 8 },
  { id: 'd', key: 'OP-129', title: 'Kanban WIP limits', tag: 'Board', tagClass: 'bg-emerald-50 text-emerald-700', points: 2 },
  { id: 'e', key: 'OP-155', title: 'Attachment signed links', tag: 'Storage', tagClass: 'bg-amber-50 text-amber-700', points: 3 }
];

const COLUMNS = ['To do', 'In progress', 'Done'];

const BoardMockup: React.FC = () => {
  const reduce = useReducedMotion();
  // Column index per card; the loop advances one card at a time so something is always moving.
  const [placement, setPlacement] = useState<Record<string, number>>({ a: 1, b: 0, c: 1, d: 2, e: 0 });
  const step = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const order: [string, number][] = [['b', 1], ['a', 2], ['e', 1], ['c', 2], ['b', 2], ['e', 2]];
    const reset = { a: 1, b: 0, c: 1, d: 2, e: 0 };
    const timer = setInterval(() => {
      if (step.current >= order.length) {
        step.current = 0;
        setPlacement(reset);
        return;
      }
      const [id, col] = order[step.current++];
      setPlacement(p => ({ ...p, [id]: col }));
    }, 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  const done = Object.values(placement).filter(c => c === 2).length;
  const percent = Math.round((done / CARDS.length) * 100);

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-amber-300/20 blur-3xl rounded-[2rem]" aria-hidden />
      <div className="relative rounded-2xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/20 overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="text-[11px] font-medium text-slate-500">Sprint 24 · Active board</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-mono font-semibold text-slate-700">{percent}%</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500" animate={{ width: `${percent}%` }} transition={{ duration: 0.6, ease: EASE }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-100/60 min-h-[21rem]">
          {COLUMNS.map((name, col) => (
            <div key={name} className="rounded-xl bg-slate-100 p-2">
              <div className="flex items-center justify-between px-1.5 pb-2 text-[11px] font-semibold text-slate-600">
                <span>{name}</span>
                <span className="font-mono text-slate-400">{CARDS.filter(c => placement[c.id] === col).length}</span>
              </div>
              <div className="space-y-2 min-h-[4rem]">
                <AnimatePresence initial={false}>
                  {CARDS.filter(c => placement[c.id] === col).map(card => (
                    <motion.div
                      key={card.id}
                      layout={!reduce}
                      layoutId={reduce ? undefined : card.id}
                      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="text-[11px] font-medium text-slate-800 leading-snug">{card.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${card.tagClass}`}>{card.tag}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono">{card.key}</span>
                          <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 font-mono text-[9px] flex items-center justify-center font-semibold">{card.points}</span>
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AI assistant demo: a question is typed, then the answer streams in
// ---------------------------------------------------------------------------

const QUESTION = 'What are my pending tasks?';
const ANSWER = [
  { k: 'OP-142', t: 'Rotate refresh tokens', m: 'High · due Friday' },
  { k: 'OP-151', t: 'Invite flow by email', m: 'Medium · in progress' }
];

const AssistantDemo: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState(reduce ? QUESTION.length : 0);
  const [showAnswer, setShowAnswer] = useState(!!reduce);

  useEffect(() => {
    if (!inView || reduce) return;
    let i = 0;
    const type = setInterval(() => {
      i++;
      setTyped(i);
      if (i >= QUESTION.length) {
        clearInterval(type);
        setTimeout(() => setShowAnswer(true), 600);
      }
    }, 55);
    return () => clearInterval(type);
  }, [inView, reduce]);

  return (
    <div ref={ref} className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden max-w-md w-full mx-auto">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold">Vision Assistant</span>
      </div>
      <div className="p-4 space-y-3 min-h-[15rem] bg-slate-50">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 text-white text-xs px-3 py-2">
            {QUESTION.slice(0, typed)}
            {typed < QUESTION.length && <span className="inline-block w-px h-3 bg-white/80 ml-0.5 align-middle animate-pulse" />}
          </div>
        </div>
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-[92%] rounded-2xl rounded-bl-sm bg-white border border-slate-200 text-xs text-slate-700 px-3 py-2.5 space-y-2"
            >
              <p className="font-semibold text-slate-900">You have 2 open tasks.</p>
              <ul className="space-y-1.5">
                {ANSWER.map(a => (
                  <li key={a.k} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 mt-0.5">{a.k}</span>
                    <span><strong className="font-medium">{a.t}</strong><br /><span className="text-slate-500">{a.m}</span></span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-600">Start with <strong>OP-142</strong>: it is high priority and due soonest.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FEATURES = [
  { icon: Kanban, title: 'Kanban boards', body: 'Drag work across customisable columns with WIP limits that flag overload before it hurts.' },
  { icon: Layers, title: 'Backlog & sprints', body: 'Plan sprints, set goals and dates, and move work between the backlog and the active sprint.' },
  { icon: BarChart3, title: 'Sprint analytics', body: 'Velocity and story-point progress at a glance, so status updates write themselves.' },
  { icon: Users, title: 'Roles & permissions', body: 'Owner, admin, member and viewer roles per project. People only see what they should.' },
  { icon: Paperclip, title: 'Files on every issue', body: 'Attach specs and screenshots. Files stay private and are served through expiring links.' },
  { icon: Bot, title: 'AI assistant', body: 'Ask “what is overdue?” or “how do I invite someone?” and get answers from your own data.' }
];

const STEPS = [
  { icon: UserPlus, title: 'Create your workspace', body: 'Sign up with your Gmail address and confirm it with a 6-digit code.' },
  { icon: Users, title: 'Invite your team', body: 'Send email invitations with the right role. They join with one click.' },
  { icon: Kanban, title: 'Plan and ship', body: 'Break work into issues, run sprints, and watch progress move on the board.' }
];

const SECURITY = [
  { icon: MailCheck, title: 'Verified accounts', body: 'Every account is confirmed with a one-time code sent to a genuine Gmail address.' },
  { icon: KeyRound, title: 'Short-lived sessions', body: 'Access tokens last 15 minutes. Refresh tokens rotate on every use and theft is detected.' },
  { icon: Lock, title: 'Private by default', body: 'Passwords are salted and hashed. Attachments are never public.' },
  { icon: ShieldCheck, title: 'Control your devices', body: 'See every signed-in device, revoke any of them, or sign out everywhere in one click.' }
];

export const HomePage: React.FC<HomePageProps> = ({ onSignIn, onSignUp }) => {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-colors cursor-pointer';

  return (
    <div className="min-h-screen w-full bg-[#faf8f3] text-slate-900 overflow-x-hidden">
      {/* ------------------------------ Navigation ------------------------------ */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-[#0a1020]/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between" aria-label="Main">
          <VisionLogo size="md" showSubtitle={false} tone="light" />
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            {[['features', 'Features'], ['how', 'How it works'], ['assistant', 'AI assistant'], ['security', 'Security']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors cursor-pointer">{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onSignIn} className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-200 hover:text-white cursor-pointer">Sign in</button>
            <button onClick={onSignUp} className={`${primaryBtn} px-4 py-2 text-sm`}>Get started</button>
          </div>
        </nav>
      </header>

      {/* ---------------------------------- Hero ---------------------------------- */}
      <section ref={heroRef} className="relative bg-[#0a1020] text-white pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* ambient background */}
        <motion.div style={{ y: orbY }} className="absolute inset-0 pointer-events-none" aria-hidden>
          <motion.div
            className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-blue-600/25 blur-[120px]"
            animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-20 right-[-8rem] w-[32rem] h-[32rem] rounded-full bg-indigo-500/25 blur-[120px]"
            animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 60, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-10rem] left-1/3 w-[28rem] h-[28rem] rounded-full bg-amber-400/10 blur-[110px]"
            animate={reduce ? undefined : { x: [0, 40, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)'
          }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-12 items-center">
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200"
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              Sprint planning for focused teams
            </motion.div>

            <h1 className="font-display text-[2.6rem] sm:text-6xl lg:text-[4.25rem] leading-[1.04] tracking-tight mt-6">
              {['Plan', 'with', 'clarity.'].map((w, i) => (
                <motion.span
                  key={w}
                  className="inline-block mr-[0.28em]"
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: EASE }}
                >
                  {w}
                </motion.span>
              ))}
              <br />
              {['Ship', 'with'].map((w, i) => (
                <motion.span
                  key={w}
                  className="inline-block mr-[0.28em]"
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.55 + i * 0.12, ease: EASE }}
                >
                  {w}
                </motion.span>
              ))}
              <motion.span
                className="inline-block italic bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 bg-clip-text text-transparent"
                initial={reduce ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
              >
                confidence.
              </motion.span>
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
              className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed"
            >
              Vision brings boards, backlogs, sprints and analytics into one calm workspace, with an AI assistant that answers from your real project data.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
              className="mt-9 flex flex-col sm:flex-row gap-3"
            >
              <button onClick={onSignUp} className={`${primaryBtn} group px-7 py-3.5 text-base`}>
                Start for free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
              >
                See how it works
              </button>
            </motion.div>

            <motion.ul
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"
            >
              {['Free to start', 'Verified accounts', 'Role-based access'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t}</li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
            style={{ perspective: 1200 }}
          >
            <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
              <BoardMockup />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------- Stats --------------------------------- */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: 7, s: '', l: 'Work item types' },
            { n: 4, s: '', l: 'Permission roles' },
            { n: 15, s: ' min', l: 'Access token lifetime' },
            { n: 6, s: '-digit', l: 'Email verification code' }
          ].map(stat => (
            <div key={stat.l}>
              <div className="font-display text-4xl sm:text-5xl text-slate-900"><CountUp to={stat.n} suffix={stat.s} /></div>
              <div className="mt-1 text-sm text-slate-500">{stat.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Features -------------------------------- */}
      <section id="features" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16">
        <SectionHeading
          eyebrow="Everything in one place"
          title={<>The tools a team needs, <span className="italic text-blue-700">nothing it doesn't</span></>}
          body="A focused toolkit for planning, tracking and delivering work, without the clutter of enterprise suites."
        />
        <div className="max-w-6xl mx-auto mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <motion.div
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="h-full rounded-2xl bg-white p-7 ring-1 ring-slate-200/80 shadow-sm hover:shadow-xl hover:ring-blue-200 transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl mt-5 text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------- How it works ------------------------------ */}
      <section id="how" className="py-24 sm:py-28 px-5 sm:px-8 bg-white border-y border-slate-200/70 scroll-mt-16">
        <SectionHeading eyebrow="How it works" title={<>From sign-up to shipped in <span className="italic text-blue-700">three steps</span></>} />
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-slate-200 overflow-hidden" aria-hidden>
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 origin-left"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.4, ease: EASE }}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.15} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-white ring-2 ring-blue-600 flex items-center justify-center text-blue-600 relative z-10 shadow-lg shadow-blue-600/10">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold tracking-widest text-amber-700 mt-5">STEP {i + 1}</div>
                <h3 className="font-display text-xl mt-1.5 text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ AI assistant ------------------------------ */}
      <section id="assistant" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-700">AI assistant</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] mt-3 text-slate-900">
              Ask your project <span className="italic text-blue-700">anything</span>
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              The assistant reads only the projects you belong to, so its answers are grounded in your real tasks, deadlines and sprints, with a clear next step every time.
            </p>
            <ul className="mt-7 space-y-3 text-slate-700">
              {['“What are my pending tasks?”', '“What is overdue this week?”', '“Summarise the current sprint.”', '“How do I invite a teammate?”'].map(q => (
                <li key={q} className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />{q}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15}><AssistantDemo /></Reveal>
        </div>
      </section>

      {/* -------------------------------- Security -------------------------------- */}
      <section id="security" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-[#0a1020] text-white overflow-hidden scroll-mt-16">
        <div className="absolute -top-32 right-0 w-[30rem] h-[30rem] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" aria-hidden />
        <SectionHeading
          light
          eyebrow="Security"
          title={<>Built to be trusted <span className="italic text-amber-200">from day one</span></>}
          body="Identity and session handling follow the same patterns used by mature products."
        />
        <div className="relative max-w-6xl mx-auto mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECURITY.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07] transition-colors">
                <s.icon className="w-6 h-6 text-amber-300" />
                <h3 className="font-display text-lg mt-4">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------- CTA ---------------------------------- */}
      <section className="py-24 sm:py-28 px-5 sm:px-8">
        <Reveal className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-[#0a1020] via-[#10204a] to-[#1e3a8a] text-white px-6 py-16 sm:px-12 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-300/10 blur-3xl" aria-hidden />
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.1] relative">Ready to bring clarity to your next sprint?</h2>
          <p className="mt-4 text-slate-300 text-lg relative">Create your free workspace in under a minute.</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <button onClick={onSignUp} className={`${primaryBtn} group px-8 py-4 text-base`}>
              Create your account
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onSignIn} className="px-8 py-4 rounded-xl text-base font-semibold border border-white/25 hover:bg-white/10 transition-colors cursor-pointer">
              I already have an account
            </button>
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------- Footer -------------------------------- */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <VisionLogo size="sm" showSubtitle={false} />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            {[['features', 'Features'], ['assistant', 'AI assistant'], ['security', 'Security']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-slate-900 cursor-pointer">{label}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Vision. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
