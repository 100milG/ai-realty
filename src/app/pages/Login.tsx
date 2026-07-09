import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { Mail, Lock, ArrowRight, User, Shield, Building2, Eye, EyeOff, Home } from "lucide-react";
import { Button } from "../components/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthBackButton } from "../components/AuthBackButton";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirectAfterLogin?: string; initialQuery?: string } | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:fetch-complete',message:'Fetch completed',data:{status:res.status,ok:res.ok,apiUrl:import.meta.env.VITE_API_URL},timestamp:Date.now(),hypothesisId:'H2-H3',runId:'post-fix'})}).catch(()=>{});
      // #endregion

      const data = await res.json();

      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:parse-complete',message:'Response parsed',data:{hasToken:!!data?.token,hasUser:!!data?.user,role:data?.user?.role},timestamp:Date.now(),hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
      // #endregion

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check credentials.");
      }

      // Save user session details in browser localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect user to the corresponding dashboard based on their role or pre-login state
      if (state?.redirectAfterLogin) {
        navigate(state.redirectAfterLogin, { state: { initialQuery: state.initialQuery } });
      } else if (data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "SUBAGENT") {
        navigate("/subagent/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:catch',message:'Login error caught',data:{name:err?.name,message:err?.message,hasResponseVar:typeof (globalThis as any).response},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper helper to quickly load seeded mock profiles and login directly
  const quickLogin = async (roleEmail: string, rolePassword = "password123") => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleEmail, password: rolePassword })
      });

      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:fetch-complete',message:'Fetch completed',data:{status:res.status,ok:res.ok,apiUrl:import.meta.env.VITE_API_URL},timestamp:Date.now(),hypothesisId:'H2-H3',runId:'post-fix'})}).catch(()=>{});
      // #endregion

      const data = await res.json();

      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:parse-complete',message:'Response parsed',data:{hasToken:!!data?.token,hasUser:!!data?.user,role:data?.user?.role},timestamp:Date.now(),hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
      // #endregion

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check credentials.");
      }

      // Save user session details in browser localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect user to the corresponding dashboard based on their role or pre-login state
      if (state?.redirectAfterLogin) {
        navigate(state.redirectAfterLogin, { state: { initialQuery: state.initialQuery } });
      } else if (data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "SUBAGENT") {
        navigate("/subagent/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7872/ingest/1292bd7c-2fa2-46d3-90f7-712f4415e2c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'195762'},body:JSON.stringify({sessionId:'195762',location:'Login.tsx:catch',message:'Login error caught',data:{name:err?.name,message:err?.message,hasResponseVar:typeof (globalThis as any).response},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] size-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] size-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <AuthBackButton />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
          <div className="size-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-soft">
            <Home className="size-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-foreground tracking-tight">AI Realty</span>
        </Link>
        <h2 className="text-center text-3xl font-display font-bold text-foreground tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-card/80 backdrop-blur-xl py-8 px-4 shadow-elevated border border-border rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center py-4 space-x-2 mb-6">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Authenticating...</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-input-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full flex justify-center items-center font-semibold text-sm py-3" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <ArrowRight className="size-4 ml-2" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
