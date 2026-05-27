import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        'Invalid analyst credentials. Please verify username and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -top-12 -left-12"></div>
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -bottom-12 -right-12"></div>

      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-brand-500/10 p-3.5 rounded-2xl text-brand-400 border border-brand-500/20 mb-3 shadow-lg shadow-brand-950/40">
            <Leaf className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight font-sans">
            Breathe ESG
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Carbon Ingestion & Compliance Ledger
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl relative">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">
            Analyst Login
          </h3>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
       <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}

                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-700/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-900/20 hover:shadow-brand-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-sm mt-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Access Ledger</span>
              )}
            </button>
          </form>

          {/* Seed accounts notice */}
          <div className="mt-6 pt-5 border-t border-slate-700/40 text-center">
            <p className="text-xs text-slate-500">
              <p>Enter your credentials to continue</p>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
