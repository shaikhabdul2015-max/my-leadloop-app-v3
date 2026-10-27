import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Repeat, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  CalendarCheck2, 
  ChevronDown, 
  MessageSquare,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView, setAuthMode, setIsUpgradeModalOpen } = useApp();

  // Interactive Live AI Follow-up Demo in Landing Page
  const [demoLeadName, setDemoLeadName] = useState('Rahul Sharma');
  const [demoStage, setDemoStage] = useState('Interested');
  const [demoLastNote, setDemoLastNote] = useState("I need to discuss budget with my partner before committing.");
  const [demoTone, setDemoTone] = useState('professional-friendly');
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [demoResult, setDemoResult] = useState<string>(
    "Hi Rahul, hope your week is off to a great start! Just checking in to see if you had a chance to connect with your partner regarding the website redesign scope we discussed? Happy to hop on a quick 5-min call if any questions came up."
  );

  const handleTestDemo = () => {
    setDemoGenerating(true);
    setTimeout(() => {
      const firstName = demoLeadName.split(' ')[0] || 'there';
      if (demoTone === 'casual') {
        setDemoResult(
          `Hey ${firstName}, hope you're having a good week! Quick check-in on the project proposal—did you get a chance to chat with your partner? Let me know if you want me to clarify anything!`
        );
      } else if (demoTone === 'short') {
        setDemoResult(
          `Hi ${firstName}, following up on our proposal discussion. Did you and your partner have a chance to review? Ready whenever you are.`
        );
      } else if (demoTone === 'persuasive') {
        setDemoResult(
          `Hi ${firstName}, wanted to follow up on the website scope. If we lock in the kickoff this week, we can guarantee delivery before your target launch date. Would tomorrow at 3 PM work for a brief sync?`
        );
      } else {
        setDemoResult(
          `Hi ${firstName}, hope you're doing well! Following up on our recent chat. Did you have a chance to review the proposal with your partner? Happy to address any questions you both might have.`
        );
      }
      setDemoGenerating(false);
    }, 700);
  };

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is LeadLoop AI?',
      a: 'LeadLoop AI is an intelligent follow-up CRM built specifically for freelancers, consultants, boutique agencies, and sales professionals. It identifies who needs a follow-up, calculates urgency heuristics, and crafts personalized messages so you never lose high-value deals.',
    },
    {
      q: 'Who is it for?',
      a: 'Freelancers, digital agency owners, B2B sales professionals, interior designers, accountants, and consultants who manage dozens of conversations across WhatsApp, Email, and Phone and struggle with follow-up consistency.',
    },
    {
      q: 'Does AI automatically send messages without my review?',
      a: 'Never. LeadLoop AI adheres to a strict human-in-the-loop principle. Every message is presented to you to review, personalize, and approve before it is scheduled or marked as sent.',
    },
    {
      q: 'Can I edit AI-generated messages?',
      a: 'Yes! Every draft can be edited inline, regenerated with different tones (professional, friendly, casual, short, persuasive), or copied directly to your clipboard.',
    },
    {
      q: 'Can I use it on mobile devices?',
      a: 'Absolutely. LeadLoop AI is built with responsive mobile-first navigation and adapts fluidly to screens from 360px smartphones to high-res desktop displays.',
    },
    {
      q: 'How does the free plan work?',
      a: 'The Free Starter plan includes up to 25 leads and 50 AI follow-up generations every month. No credit card required. You can upgrade to Pro anytime for up to 500 leads and unlimited generations.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All data is structured with multi-tenant workspace isolation and PostgreSQL Row Level Security (RLS) architecture. AI API keys are strictly kept server-side.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Landing Header */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-6 lg:px-12 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
              LeadLoop <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">AI</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#how-it-works" className="hover:text-indigo-600 transition">How It Works</a>
          <a href="#demo" className="hover:text-indigo-600 transition">Interactive Demo</a>
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          <a href="#faq" className="hover:text-indigo-600 transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAuthMode('login');
              setCurrentView('auth');
            }}
            className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setCurrentView('auth');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-500 transition"
          >
            <span>Start Free</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-indigo-50/40 via-white to-white">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI-Powered Follow-up CRM for Modern Closers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Stop Losing Customers <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Because You Forgot to Follow Up.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            LeadLoop AI tracks your leads, calculates urgency scores, tells you who needs attention,
            and writes tailored, high-converting follow-up messages so you can focus on closing deals.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => {
                setAuthMode('signup');
                setCurrentView('auth');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition"
            >
              <span>Start Free (No Credit Card)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Play className="h-4 w-4 text-indigo-600 fill-indigo-600" />
              <span>Explore Live Dashboard</span>
            </button>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free up to 25 leads
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Structured Gemini 3.8 Flash AI
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1-Click WhatsApp & Email
            </span>
          </div>
        </div>
      </section>

      {/* The Core Problem Section */}
      <section className="py-20 border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600">The Silent Revenue Killer</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              80% of sales require 5 follow-ups. 44% of sales pros give up after 1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 w-fit">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Forgotten Follow-ups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leads message you on WhatsApp, email, or LinkedIn. In the daily rush of client deliverables, days pass and warm prospects turn ice-cold.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 w-fit">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Blank Screen Paralysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "What should I say without sounding desperate or annoying?" Staring at an empty chat window causes delays and missed deal momentum.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 w-fit">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Clunky Traditional CRMs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enterprise CRMs are bloated spreadsheets with 40 fields. Freelancers and small agencies need an agile tool focused squarely on next-steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Simple 3-Step Workflow</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How LeadLoop AI Keeps Your Pipeline Hot
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
                1
              </span>
              <h3 className="font-bold text-slate-900 text-lg">Add Your Leads</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drop in prospective clients in seconds. Tag services, deal value, and paste quick notes from your last conversation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
                2
              </span>
              <h3 className="font-bold text-slate-900 text-lg">Let AI Find Who Needs Attention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our smart heuristic engine analyzes days since contact, stage hesitation, and customer intent to surface daily priority recommendations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
                3
              </span>
              <h3 className="font-bold text-slate-900 text-lg">Send the Perfect Follow-up</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One click generates a personalized, tone-matched draft. Tweak it, approve it, and schedule your reminder seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Demo Widget */}
      <section id="demo" className="py-20 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Live Interactive Test Drive
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Experience the AI Follow-Up Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Try changing the prospect situation below to see how our engine adapts the tone and rationale.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name</label>
                <input
                  type="text"
                  value={demoLeadName}
                  onChange={(e) => setDemoLeadName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stage</label>
                <select
                  value={demoStage}
                  onChange={(e) => setDemoStage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
                >
                  <option value="Interested">Interested</option>
                  <option value="Negotiating">Negotiating</option>
                  <option value="Contacted">Contacted</option>
                  <option value="New">New Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tone Preference</label>
                <select
                  value={demoTone}
                  onChange={(e) => setDemoTone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
                >
                  <option value="professional-friendly">Professional-Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="short">Short & Direct</option>
                  <option value="persuasive">Persuasive (ROI Focused)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Interaction Note</label>
              <input
                type="text"
                value={demoLastNote}
                onChange={(e) => setDemoLastNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleTestDemo}
                disabled={demoGenerating}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span>{demoGenerating ? 'AI is analyzing lead...' : 'Generate Follow-up Message'}</span>
              </button>
            </div>

            {/* Output Box */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Personalized Message Draft:
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed italic bg-white p-3 rounded-lg border border-indigo-100/60">
                "{demoResult}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Transparent Pricing</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              One Closed Deal Pays for a Lifetime of Follow-ups
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Free Starter</h3>
                <p className="text-xs text-slate-500 mt-1">For solopreneurs testing the waters.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs text-slate-400">/forever</span>
                </div>
                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 25 leads</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 50 AI generations / mo</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Kanban Sales Pipeline</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> In-app reminders</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setCurrentView('auth');
                }}
                className="mt-8 w-full rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro (Highlighted) */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-indigo-50/20 p-6 flex flex-col justify-between shadow-xl shadow-indigo-100">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Professional</h3>
                <p className="text-xs text-slate-500 mt-1">For active consultants & freelancers.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$29</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 500 leads</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited AI follow-ups</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> All 6 communication tones</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Smart Intent heuristics</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Conversion analytics</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setCurrentView('auth');
                }}
                className="mt-8 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
              >
                Start Free Trial
              </button>
            </div>

            {/* Business */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Business Growth</h3>
                <p className="text-xs text-slate-500 mt-1">For agencies & boutique sales teams.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$79</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 5,000 leads</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 10 team seats</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited AI sequences</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Custom pipeline stages</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Priority strategist support</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setCurrentView('auth');
                }}
                className="mt-8 w-full rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 border-t border-slate-100 bg-slate-50/40">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Frequently Asked Questions</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything You Need to Know
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4.5 text-left font-bold text-sm text-slate-900 hover:text-indigo-600 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Never Lose Another Customer to Poor Follow-up?
          </h2>
          <p className="text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
            Join hundreds of consultants, agencies, and sales professionals who close deals faster with LeadLoop AI.
          </p>
          <div>
            <button
              onClick={() => {
                setAuthMode('signup');
                setCurrentView('auth');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-950 shadow-xl hover:bg-slate-100 transition"
            >
              <span>Get Started Now for Free</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-indigo-600" />
            <span className="font-bold text-slate-700">LeadLoop AI</span>
            <span>• "Never lose a customer because you forgot to follow up."</span>
          </div>
          <div>© {new Date().getFullYear()} LeadLoop AI Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
