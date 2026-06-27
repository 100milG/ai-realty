import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, ArrowRight, User, Phone, Home, Eye, EyeOff, Building2, Users } from "lucide-react";
import { Button } from "../components/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthBackButton } from "../components/AuthBackButton";

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setIsLoading(false);
    }
  };

  const inputClass =
    "block w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in
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

          {success && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Are you registering as a:
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setRole("CUSTOMER")}
                  className={`flex items-center justify-center py-2.5 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    role === "CUSTOMER"
                      ? "bg-primary/10 border-primary text-primary shadow-soft"
                      : "bg-secondary border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Users className="size-4 mr-2" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("SUBAGENT")}
                  className={`flex items-center justify-center py-2.5 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    role === "SUBAGENT"
                      ? "bg-primary/10 border-primary text-primary shadow-soft"
                      : "bg-secondary border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Building2 className="size-4 mr-2" />
                  Subagent
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name *
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address *
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password *
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
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

            <Button
              type="submit"
              size="lg"
              className="w-full flex justify-center items-center font-semibold text-sm py-3 mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign up"}
              {!isLoading && <ArrowRight className="size-4 ml-2" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
