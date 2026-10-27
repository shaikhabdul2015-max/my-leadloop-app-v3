import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Repeat, ArrowRight, Lock, Mail, User, Sparkles, Check } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { authMode, setAuthMode, login, signup, showToast, setCurrentView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else if (authMode === 'signup') {
        await signup(email, password, name);
      } else {
        showToast(`Password reset link sent to ${email}`, 'info');
        setAuthMode('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestDrive = async () => {
    setLoading(true);
    await login('abdul@leadloop.ai', 'demo1234');
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setTimeout(async () => {
      await login('google.user@example.com', 'oauth');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Repeat className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Your Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500">
            {authMode === 'login'
              ? 'Enter your credentials to access your follow-up pipeline'
              : authMode === 'signup'
              ? 'Join LeadLoop AI and stop losing warm prospects'
              : 'Enter your email and we will send a reset link'}
          </p>
        </div>

        {/* 1-Click Test Drive Button */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-center space-y-1.5">
          <button
            type="button"
            onClick={handleTestDrive}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            <span>Instant 1-Click Demo Login</span>
          </button>
          <span className="text-[10px] text-slate-400 block">Pre-loaded with sample leads, activities & follow-ups</span>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-100" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">Or continue with</span>
          <div className="w-full border-t border-slate-100" />
        </div>

        {/* Google OAuth Simulation */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Traditional Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : authMode === 'login'
              ? 'Sign In to Workspace'
              : authMode === 'signup'
              ? 'Create Free Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {authMode === 'login' ? (
            <p>
              Don’t have an account yet?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="font-bold text-indigo-600 hover:underline"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setAuthMode('login')}
                className="font-bold text-indigo-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ← Back to marketing site
          </button>
        </div>
      </div>
    </div>
  );
};
