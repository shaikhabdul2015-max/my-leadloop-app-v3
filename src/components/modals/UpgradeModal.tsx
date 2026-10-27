import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { PlanType } from '../../types';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, subscription, upgradePlan } = useApp();

  if (!isUpgradeModalOpen) return null;

  const plans: {
    id: PlanType;
    name: string;
    price: string;
    period: string;
    description: string;
    badge?: string;
    features: string[];
    icon: React.ReactNode;
  }[] = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      description: 'Ideal for testing and individual solopreneurs.',
      icon: <Sparkles className="h-5 w-5 text-slate-500" />,
      features: [
        'Up to 25 leads',
        '50 AI generations / month',
        'Basic Pipeline & Activity tracking',
        'In-app reminders',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'For active freelancers and independent sales consultants.',
      badge: 'Most Popular',
      icon: <Zap className="h-5 w-5 text-indigo-600" />,
      features: [
        'Up to 500 leads',
        'Unlimited AI follow-up generations',
        'All communication tones & channels',
        'Smart intent analysis & heuristics',
        'Advanced conversion analytics',
        'Priority email support',
      ],
    },
    {
      id: 'business',
      name: 'Business Growth',
      price: '$79',
      period: 'per month',
      description: 'For fast-growing boutique agencies and sales teams.',
      icon: <Shield className="h-5 w-5 text-emerald-600" />,
      features: [
        'Up to 5,000 leads',
        'Unlimited AI follow-ups & sequences',
        'Up to 10 team members',
        'Custom pipeline stages & automation',
        'CSV Export & CRM integrations',
        'Dedicated onboarding strategist',
      ],
    },
    {
      id: 'agency',
      name: 'Agency & Enterprise',
      price: '$199',
      period: 'per month',
      description: 'For full-service agencies managing client pipelines.',
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      features: [
        '25,000+ leads',
        'Multiple client workspaces',
        'White-label reports & branding',
        'Unlimited team members',
        'API & Webhook access',
        'SLA & dedicated account manager',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              Upgrade Your LeadLoop AI Workspace
            </h3>
            <p className="text-xs text-slate-500">
              Never miss a high-ticket follow-up. Choose the plan that fits your growth.
            </p>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isCurrent = subscription.plan === p.id;
            const isPro = p.id === 'pro';

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  isPro
                    ? 'border-2 border-indigo-600 bg-indigo-50/20 shadow-md shadow-indigo-100'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                    {p.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-slate-100/80 inline-block">{p.icon}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-3">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-400">/{p.period}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <button
                    onClick={() => upgradePlan(p.id)}
                    disabled={isCurrent}
                    className={`w-full rounded-xl py-2 text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : isPro
                        ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Select ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-center text-xs text-slate-500">
          Instant activation • Simulated Stripe billing architecture • Cancel or change plans anytime
        </div>
      </div>
    </div>
  );
};
