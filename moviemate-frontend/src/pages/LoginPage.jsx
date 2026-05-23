import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Film, Eye, EyeOff } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin, isAuthenticated } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/home" replace />;

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

  const redirectAfterAuth = (user) => {
    navigate(user?.is_onboarded ? '/home' : '/onboarding', { replace: true });
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

    const result = await login(form.email.trim(), form.password);

    setLoading(false);

    if (result.success) {
      redirectAfterAuth(result.user);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Google did not return a credential.');
      return;
    }

    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      redirectAfterAuth(result.user);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-dark overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-dark-card border border-dark-border rounded-xl p-8 shadow-2xl"
      >
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-lg bg-white text-black text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-dark-border" />
          <span className="text-gray-500 text-xs uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-dark-border" />
        </div>

        <div className="flex justify-center">
          {googleClientId ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              text="continue_with"
              theme="filled_black"
              shape="rectangular"
              width="360"
            />
          ) : (
            <div className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-center text-sm text-gray-400">
              Google sign-in is not configured.
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-white hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </Motion.div>
    </div>
  );
}
