import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Home,
  Search,
  MessageSquare,
  User,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Shield,
  Building2,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setPortalDropdownOpen(false);
    setIsLogoutModalOpen(false);
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPortalDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { to: currentUser ? "/customer/search" : "/search", label: "Search", icon: Search },
    ...(location.pathname !== "/"
      ? [{ to: currentUser ? "/customer/ai-chat" : "/ai-chat", label: "AI Assistant", icon: Sparkles }]
      : []),
  ];

  const isLanding = location.pathname === "/";
  const isAiChat =
    location.pathname === "/ai-chat" || location.pathname === "/customer/ai-chat";

  return (
    <div className="min-h-screen bg-background">
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-card/80 backdrop-blur-xl border-b border-border shadow-soft"
            : "bg-card border-b border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="size-9 bg-gradient-brand rounded-lg flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                  <Home className="size-4.5 text-white" />
                </div>
                <span className="font-display text-xl font-semibold text-foreground tracking-tight">
                  AI Realty
                </span>
              </Link>
              <div className="hidden md:flex gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
              <ThemeToggle />
              {currentUser ? (
                <>
                  <button
                    onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition-colors cursor-pointer focus:outline-none text-sm"
                  >
                    <div className="size-7 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="size-3.5 text-primary" />
                    </div>
                    <span className="font-medium">{currentUser.name || "My Account"}</span>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 ${
                        portalDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {portalDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-card rounded-xl shadow-elevated border border-border py-2 z-50">
                      <div className="px-4 py-2 border-b border-border mb-1">
                        <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                      </div>
                      {currentUser.role === "CUSTOMER" && (
                        <Link
                          to="/customer/dashboard"
                          onClick={() => setPortalDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <User className="size-4" />
                          <span>Customer Portal</span>
                        </Link>
                      )}
                      {currentUser.role === "SUBAGENT" && (
                        <Link
                          to="/subagent/dashboard"
                          onClick={() => setPortalDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Building2 className="size-4" />
                          <span>Subagent Portal</span>
                        </Link>
                      )}
                      {currentUser.role === "ADMIN" && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setPortalDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Shield className="size-4" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="size-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login">
                  <ButtonSignIn />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              >
                {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {currentUser ? (
              <div className="border-t border-border my-2 pt-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {currentUser.name}
                </p>
                {currentUser.role === "CUSTOMER" && (
                  <Link
                    to="/customer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    <User className="size-5" />
                    <span>Customer Portal</span>
                  </Link>
                )}
                {currentUser.role === "SUBAGENT" && (
                  <Link
                    to="/subagent/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    <Building2 className="size-5" />
                    <span>Subagent Portal</span>
                  </Link>
                )}
                {currentUser.role === "ADMIN" && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    <Shield className="size-5" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors cursor-pointer mt-1"
                >
                  <LogOut className="size-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-primary text-primary-foreground font-medium mt-3"
              >
                <User className="size-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      {!isAiChat && !isLanding && (
        <Link
          to={currentUser ? "/customer/ai-chat" : "/ai-chat"}
          className="fixed bottom-6 right-6 size-14 bg-gradient-brand rounded-full shadow-elevated flex items-center justify-center hover:scale-105 transition-transform z-40 group"
          aria-label="Open AI chat"
        >
          <MessageSquare className="size-6 text-white group-hover:scale-110 transition-transform" />
        </Link>
      )}

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}

function ButtonSignIn() {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft transition-colors text-sm font-medium">
      <User className="size-4" />
      Sign In
    </span>
  );
}
