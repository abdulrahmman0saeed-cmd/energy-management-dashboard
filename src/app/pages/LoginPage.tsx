import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useApp } from "../context/AppContext";

const MOCK_PASSWORD = "Saudia2025";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  loading: boolean;
  error: string;
  attempts: number;
  lockedUntil: number | null;
}

export function LoginPage() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState<LoginState>({
    email: "", password: "", showPassword: false, rememberMe: false,
    loading: false, error: "", attempts: 0, lockedUntil: null,
  });
  const [showForgot, setShowForgot] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<LoginState>) => setForm(f => ({ ...f, ...patch }));

  const remainingLockout = form.lockedUntil ? Math.ceil((form.lockedUntil - Date.now()) / 1000) : 0;
  const isLocked = remainingLockout > 0;

  const validate = (): string => {
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.password) return "Password is required.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const validationError = validate();
    if (validationError) { set({ error: validationError }); return; }

    set({ loading: true, error: "" });

    // Simulate network delay
    await new Promise(r => setTimeout(r, 700));

    const user = state.users.find(u => u.email.toLowerCase() === form.email.toLowerCase().trim());
    const passwordOk = form.password === MOCK_PASSWORD;

    if (!user || !passwordOk) {
      const newAttempts = form.attempts + 1;
      const locked = newAttempts >= MAX_ATTEMPTS;
      set({
        loading: false,
        error: locked
          ? `Too many failed attempts. Account locked for 60 seconds.`
          : `Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`,
        attempts: newAttempts,
        lockedUntil: locked ? Date.now() + LOCKOUT_MS : null,
        password: "",
      });
      if (locked) {
        setTimeout(() => set({ lockedUntil: null, attempts: 0, error: "" }), LOCKOUT_MS);
      }
      return;
    }

    dispatch({ type: "LOGIN", payload: { userId: user.id, remember: form.rememberMe } });
  };

  if (showForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Password Reset</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Contact your system administrator to reset your password.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent/40 rounded-lg text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Administrator contact:</p>
              <p>IT Support: it-support@saudia.com</p>
              <p>Help Desk: ext. 4100</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowForgot(false)}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-sidebar to-sidebar-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8 text-sidebar-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Spare Parts Tracking</h1>
          <p className="text-sm text-muted-foreground">Saudi Airlines — MRO Engineering</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    placeholder="you@saudia.com"
                    className="pl-9"
                    value={form.email}
                    onChange={e => set({ email: e.target.value, error: "" })}
                    disabled={form.loading || isLocked}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={form.showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    value={form.password}
                    onChange={e => set({ password: e.target.value, error: "" })}
                    disabled={form.loading || isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => set({ showPassword: !form.showPassword })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {form.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 accent-primary rounded"
                  checked={form.rememberMe}
                  onChange={e => set({ rememberMe: e.target.checked })}
                  disabled={form.loading || isLocked}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me on this device
                </Label>
              </div>

              {/* Error */}
              {form.error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{form.error}</span>
                </div>
              )}

              {/* Lockout countdown */}
              {isLocked && (
                <div className="text-center text-sm text-muted-foreground">
                  Try again in <span className="font-semibold text-foreground">{remainingLockout}s</span>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full gap-2" disabled={form.loading || isLocked}>
                {form.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials panel */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Demo Credentials</p>
            <p className="text-xs text-muted-foreground mb-3">Password for all accounts: <span className="font-mono font-semibold text-foreground">Saudia2025</span></p>
            <div className="space-y-1.5">
              {state.users.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => set({ email: u.email, error: "" })}
                    className="text-primary hover:underline font-mono truncate max-w-[200px]"
                  >
                    {u.email}
                  </button>
                  <Badge
                    className={`text-[10px] border ml-2 flex-shrink-0 ${
                      u.role === "Admin"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : u.role === "Maintenance Team"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
