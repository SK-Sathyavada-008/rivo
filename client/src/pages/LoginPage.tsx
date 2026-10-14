import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, password, name, academyName, phone });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FCF9] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-xs border border-[#E2EBE5] mb-2">
            <img src="/logo.svg" alt="Rivo Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#18392D] tracking-tight">Rivo</h1>
          <p className="text-sm font-medium text-[#718078]">
            Fees in flow. — Automated reconciliation for dance academies & schools
          </p>
        </div>

        {/* Quick Demo Access Card (Judges / Evaluation) */}
        <div className="bg-linear-to-br from-[#18392D] to-[#15966A] rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#DDF7E9]">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Instant Judge & Evaluator Demo</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">1-Click</span>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed">
            Explore <strong>Nrityanjali Dance Academy</strong> pre-loaded with 14 students, 4 batches, sibling payments, WhatsApp evidence, and bank reconciliation exceptions.
          </p>

          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoAccess}
            isLoading={demoLoading}
            className="w-full bg-[#DDF7E9] hover:bg-white text-[#18392D] font-bold text-sm h-11 shadow-md"
          >
            <span>Explore Demo Academy Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Login / Register Card */}
        <Card className="shadow-md">
          <div className="flex border-b border-[#E2EBE5] mb-5">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                !isRegister
                  ? 'border-[#15966A] text-[#15966A]'
                  : 'border-transparent text-[#718078] hover:text-[#26352E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                isRegister
                  ? 'border-[#15966A] text-[#15966A]'
                  : 'border-transparent text-[#718078] hover:text-[#26352E]'
              }`}
            >
              Register Teacher
            </button>
          </div>

          {error ? (
            <div className="p-3 mb-4 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#26352E] mb-1">Teacher Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ananya Natarajan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26352E] mb-1">Academy / School Name *</label>
                  <input
                    type="text"
                    required
                    value={academyName}
                    onChange={e => setAcademyName(e.target.value)}
                    placeholder="e.g. Nrityanjali Dance Academy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26352E] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-[#26352E] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="teacher@academy.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26352E] mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full h-11 text-sm font-bold mt-2">
              {isRegister ? 'Create Academy Account' : 'Sign In to Dashboard'}
            </Button>
          </form>
        </Card>

        {/* Safe promise info */}
        <div className="text-center text-xs text-[#718078] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#15966A]" />
          <span>Independent reconciliation. Never holds or redirects money.</span>
        </div>
      </div>
    </div>
  );
};
