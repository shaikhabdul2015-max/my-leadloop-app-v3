import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, Check, Building2, User, MessageSquare } from 'lucide-react';
import { ToneOption } from '../types';

export const OnboardingPage: React.FC = () => {
  const { user, finishOnboarding } = useApp();

  const [step, setStep] = useState<number>(1);
  const [fullName, setFullName] = useState<string>(user.full_name || '');
  const [workspaceName, setWorkspaceName] = useState<string>('My Growth Workspace');
  const [businessType, setBusinessType] = useState<string>('freelance');
  const [productDesc, setProductDesc] = useState<string>('Custom Webflow Design & High-Converting Landing Pages');
  const [preferredTone, setPreferredTone] = useState<ToneOption>('professional-friendly');
  const [saving, setSaving] = useState<boolean>(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    await finishOnboarding({
      full_name: fullName.trim() || 'Sales Pro',
      business_type: businessType,
      product_description: productDesc.trim(),
      preferred_tone: preferredTone,
      workspace_name: workspaceName.trim() || 'My Growth Workspace',
    });
    setSaving(false);
  };

  const businessTypes = [
    { id: 'freelance', label: 'Freelancer / Solopreneur', desc: 'Independent designer, developer, or copywriter' },
    { id: 'agency', label: 'Boutique Agency / Studio', desc: 'Digital marketing, design, dev or branding agency' },
    { id: 'consultancy', label: 'Consultant / Advisor', desc: 'Management, financial, legal or tech consulting' },
    { id: 'sales_team', label: 'B2B Sales Professional', desc: 'Account executive, SDR, or commercial sales rep' },
  ];

  const toneOptions: { id: ToneOption; label: string; desc: string; sample: string }[] = [
    { 
      id: 'professional-friendly', 
      label: 'Professional-Friendly (Recommended)', 
      desc: 'Warm, polite, yet business-focused', 
      sample: 'Hope your week is off to a great start! Just wanted to circle back regarding...' 
    },
    { 
      id: 'casual', 
      label: 'Casual & Modern', 
      desc: 'Relaxed, direct peer-to-peer style', 
      sample: 'Hey Rahul, hope you are having a good week! Quick check-in on...' 
    },
    { 
      id: 'short', 
      label: 'Short & Direct', 
      desc: '1-2 punchy sentences, zero fluff', 
      sample: 'Hi Rahul, following up on our proposal. Any questions before we finalize?' 
    },
    { 
      id: 'persuasive', 
      label: 'Persuasive (ROI Focused)', 
      desc: 'Emphasizes deadline value and outcome', 
      sample: 'Hi Rahul, following up on the redesign. If we start this week, we guarantee launch by...' 
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Step {step} of 4</span>
            <span className="text-indigo-600 font-bold">Personalizing Your Loop</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Name & Workspace */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Welcome! What should we call you?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Let's set up your profile and give your sales workspace a name.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdul Shaikh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexus Growth Studio"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Type */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">What best describes your business?</h2>
              <p className="text-xs text-slate-500 mt-1">
                LeadLoop AI adjusts follow-up cycle lengths based on your deal velocity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businessTypes.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBusinessType(b.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    businessType === b.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900">{b.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Service / Product */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">What service or product do you offer?</h2>
              <p className="text-xs text-slate-500 mt-1">
                The AI references this to write genuine, context-aware follow-up messages.
              </p>
            </div>

            <div>
              <textarea
                rows={4}
                placeholder="e.g. B2B SaaS web redesigns, Webflow engineering, and conversion rate audits."
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Keep it concise (1-2 sentences). You can always refine this in Settings later.
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Preferred Tone */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Select your default communication tone</h2>
              <p className="text-xs text-slate-500 mt-1">
                How should the AI sound when drafting messages to your leads?
              </p>
            </div>

            <div className="space-y-2.5">
              {toneOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPreferredTone(t.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    preferredTone === t.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900">{t.label}</p>
                    {preferredTone === t.id && <Check className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                  <p className="text-[11px] text-indigo-900/70 italic mt-1.5 font-medium bg-white/60 p-1.5 rounded border border-indigo-100/50">
                    "{t.sample}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <span>{saving ? 'Setting Up...' : step === 4 ? 'Launch Dashboard' : 'Continue'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
