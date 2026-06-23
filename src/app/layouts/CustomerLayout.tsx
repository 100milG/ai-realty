import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, Search, MessageSquare, User, Sparkles, Menu, X, ChevronDown, Shield, Building2, LogOut } from "lucide-react";

export function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setPortalDropdownOpen(false);
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
    { to: currentUser ? "/customer/ai-chat" : "/ai-chat", label: "AI Assistant", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="size-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Home className="size-5 text-white" />
                </div>
                <span className="font-semibold text-xl text-gray-900">AI Realty</span>
              </Link>
              <div className="hidden md:flex space-x-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-primary"
                          : "text-gray-600 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 relative" ref={dropdownRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none"
                  >
                    <User className="size-4" />
                    <span>{currentUser.name || "My Account"}</span>
                    <ChevronDown className={`size-4 transition-transform duration-200 ${portalDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {portalDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                      <div className="px-4 py-1.5 border-b border-gray-100 mb-1">
                        <p className="text-xs font-semibold text-gray-900">{currentUser.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setPortalDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                      >
                        <User className="size-4 text-gray-500" />
                        <span>Customer Portal</span>
                      </Link>
                      <Link
                        to="/subagent/dashboard"
                        onClick={() => setPortalDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                      >
                        <Building2 className="size-4 text-gray-500" />
                        <span>Subagent Portal</span>
                      </Link>
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setPortalDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                      >
                        <Shield className="size-4 text-gray-500" />
                        <span>Admin Portal</span>
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="size-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/95 shadow-sm transition-colors"
                >
                  <User className="size-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state. */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-primary font-medium"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {currentUser ? (
              <div className="border-t border-gray-100 my-2 pt-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account: {currentUser.name}
                </div>
                <Link
                  to="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <User className="size-5 text-gray-400" />
                  <span>Customer Portal</span>
                </Link>
                <Link
                  to="/subagent/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Building2 className="size-5 text-gray-400" />
                  <span>Subagent Portal</span>
                </Link>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Shield className="size-5 text-gray-400" />
                  <span>Admin Portal</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center space-x-2 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer mt-2"
                >
                  <LogOut className="size-5 text-red-400" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 px-3 py-3 rounded-lg bg-primary text-white hover:bg-primary/95 text-center font-medium shadow-sm transition-colors mt-4"
              >
                <User className="size-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Floating AI Chat Button */}
      {location.pathname !== '/ai-chat' && location.pathname !== '/customer/ai-chat' && (
        <Link
          to={currentUser ? "/customer/ai-chat" : "/ai-chat"}
          className="fixed bottom-6 right-6 size-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-40"
        >
          <MessageSquare className="size-6 text-white" />
        </Link>
      )}
    </div>
  );
}
