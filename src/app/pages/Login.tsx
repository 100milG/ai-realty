import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, ArrowRight, User, Shield, Building2, Eye, EyeOff, Home } from "lucide-react";
import { Button } from "../components/Button";

export function Login() {
  const navigate = useNavigate();
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

      // Redirect user to the corresponding dashboard based on their role
      if (data.user.role === "ADMIN") {
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

  // Helper helper to quickly load seeded mock profiles for testing
  const quickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] size-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] size-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
          <div className="size-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Home className="size-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">AI Realty</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-950/40 border border-red-800/60 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-slate-500" />
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-slate-500" />
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
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
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

          {/* Quick Login Section for Developer Evaluation */}
          <div className="mt-8 border-t border-slate-850 pt-6">
            <span className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Quick Test Accounts (Seeded)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("priya@example.com")}
                className="flex flex-col items-center justify-center p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:bg-slate-900/90 transition-all group cursor-pointer"
              >
                <User className="size-5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-medium text-slate-300 mt-1">Customer</span>
                <span className="text-[8px] text-slate-500">Priya</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("raj@example.com")}
                className="flex flex-col items-center justify-center p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:bg-slate-900/90 transition-all group cursor-pointer"
              >
                <Building2 className="size-5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-medium text-slate-300 mt-1">Subagent</span>
                <span className="text-[8px] text-slate-500">Raj</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("admin@example.com")}
                className="flex flex-col items-center justify-center p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:bg-slate-900/90 transition-all group cursor-pointer"
              >
                <Shield className="size-5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-medium text-slate-300 mt-1">Admin</span>
                <span className="text-[8px] text-slate-500">System</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
