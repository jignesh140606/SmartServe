import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, User } from 'lucide-react';
import type { AxiosError } from 'axios';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const user = await login(email, password);

      // Redirect based on role or original destination
      if (fromLocation && fromLocation !== '/login') {
        navigate(fromLocation, { replace: true });
      } else {
        const roleRedirect = {
          admin: '/admin',
          employee: '/employee',
          customer: '/customer',
        }[user.role] || '/';
        navigate(roleRedirect, { replace: true });
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message ||
        'Unable to log in. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@smartserve.io');
    setPassword('SecurePassword123!');
    setError(null);
  };

  const fillDemoEmployee = () => {
    setEmail('sarah.support@smartserve.io');
    setPassword('AgentSecurePassword123!');
    setError(null);
  };

  const fillDemoCustomer = () => {
    setEmail('john.customer@example.com');
    setPassword('CustomerPass123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-neutral-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-soft-sm font-bold text-xl">
            <Sparkles className="w-6 h-6 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">SmartServe</h1>
          <p className="text-sm text-neutral-500">Sign in to your service operations portal</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft-md border-neutral-200/90">
          <CardHeader border>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-5">
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2.5 text-status-open-text text-sm">
                  <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <Input
                label="Work Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="current-password"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </div>
            </CardContent>

            <CardFooter border className="flex flex-col gap-3.5 pt-4 bg-neutral-50/50">
              {/* Quick Fill Demo Credentials */}
              <div className="w-full flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Quick Demo Login Fill:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/40 transition-all flex items-center justify-center gap-1 shadow-soft-xs"
                    title="Fill Admin credentials (admin@smartserve.io)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={fillDemoEmployee}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/40 transition-all flex items-center justify-center gap-1 shadow-soft-xs"
                    title="Fill Specialist credentials (sarah.support@smartserve.io)"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-status-in-progress-500 shrink-0" />
                    <span>Specialist</span>
                  </button>

                  <button
                    type="button"
                    onClick={fillDemoCustomer}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/40 transition-all flex items-center justify-center gap-1 shadow-soft-xs"
                    title="Fill Customer credentials (john.customer@example.com)"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>Customer</span>
                  </button>
                </div>
              </div>

              <div className="w-full text-center text-xs text-neutral-600 pt-1 border-t border-neutral-200/60">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                  Create customer account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
