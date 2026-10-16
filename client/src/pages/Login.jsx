import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await login(email.trim(), password);

      if (res.user.role === 'ADMIN') {
        navigate(from || '/admin', { replace: true });
      } else {
        navigate(from || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 items-center justify-center text-white shadow-lg shadow-brand-600/30 mb-3">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          BookLeaf Publishing
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          Author Support & Communication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-rose-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-md shadow-brand-600/30 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('priya.sharma@email.com', 'author123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Author: Priya Sharma
                    </span>
                    <span className="block text-[11px] text-slate-500">priya.sharma@email.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('rohit.kapoor@email.com', 'author123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Author: Rohit Kapoor
                    </span>
                    <span className="block text-[11px] text-slate-500">rohit.kapoor@email.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@bookleaf.com', 'admin123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Admin: Operations Lead
                    </span>
                    <span className="block text-[11px] text-slate-500">admin@bookleaf.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
