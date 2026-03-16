import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Eye, EyeOff, Chrome, Apple } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Enter a valid email address.';
    }
    if (!form.password) e.password = 'Password is required.';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await login(form.email.trim(), form.password);
      if (result?.user?.isOnboarded === false) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    } catch {
      setErrors({ form: 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-dark overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-dark-card border border-dark-border rounded-xl p-8 shadow-2xl"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-black">
            <Film className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-white text-2xl font-bold tracking-tight">Welcome back to MovieMate</h2>
            <p className="text-gray-400 text-sm">Enter your details to access your watchlist</p>
          </div>
        </div>

        {errors.form && (
          <p className="text-red-500 text-sm text-center mb-4">{errors.form}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className={`h-12 w-full rounded-lg border bg-dark px-4 text-white placeholder:text-gray-600 outline-none transition-all focus:border-accent ${errors.email ? 'border-red-500' : 'border-dark-border'}`}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm font-medium">Password</label>
              <button type="button" className="text-gray-400 hover:text-white text-xs transition-colors">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`h-12 w-full rounded-lg border bg-dark px-4 pr-12 text-white placeholder:text-gray-600 outline-none transition-all focus:border-accent ${errors.password ? 'border-red-500' : 'border-dark-border'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-lg bg-white text-black text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-dark-border" />
          <span className="text-gray-500 text-xs uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-dark-border" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => toast('Google login coming soon!')}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-dark-border bg-transparent text-white hover:bg-white/5 transition-colors"
          >
            <Chrome className="w-4 h-4" />
            <span className="text-xs font-semibold">Google</span>
          </button>
          <button
            type="button"
            onClick={() => toast('Apple login coming soon!')}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-dark-border bg-transparent text-white hover:bg-white/5 transition-colors"
          >
            <Apple className="w-4 h-4" />
            <span className="text-xs font-semibold">Apple</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-white hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
