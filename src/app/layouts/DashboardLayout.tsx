import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Home,
  LayoutDashboard,
  Building2,
  Users,
  User,
  MessageSquare,
  FileCheck,
  Shield,
  Eye,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Heart,
  Sparkles,
} from "lucide-react";
import { Badge } from "../components/Badge";
import { ThemeToggle } from "../components/ThemeToggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
  const userRole = user?.role || "";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (location.pathname.startsWith("/admin") && userRole !== "ADMIN") {
      navigate(userRole === "SUBAGENT" ? "/subagent/dashboard" : "/customer/dashboard");
    } else if (
      location.pathname.startsWith("/subagent") &&
      userRole !== "ADMIN" &&
      userRole !== "SUBAGENT"
    ) {
      navigate("/customer/dashboard");
    }
  }, [token, userRole, location.pathname]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLogoutModalOpen(false);
    navigate("/login");
  };

  const isCustomer = location.pathname.startsWith("/customer");
  const isSubagent = location.pathname.startsWith("/subagent");
  const isAdmin = location.pathname.startsWith("/admin");

  const customerLinks = [
    { path: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customer/chat", label: "Messages", icon: MessageSquare },
    { path: "/customer/saved", label: "Saved", icon: Heart },
    { path: "/customer/search", label: "Search", icon: Home },
    { path: "/customer/ai-chat", label: "AI Assistant", icon: Sparkles },
  ];

  const subagentLinks = [
    { path: "/subagent/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/subagent/properties", label: "Properties", icon: Building2 },
    { path: "/subagent/leads", label: "Leads", icon: Users },
    { path: "/subagent/chat", label: "Messages", icon: MessageSquare },
    { path: "/subagent/kyc", label: "KYC", icon: FileCheck },
    { path: "/subagent/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/properties", label: "Properties", icon: Building2 },
    { path: "/admin/approvals", label: "Approvals", icon: CheckCircle },
    { path: "/admin/moderation", label: "Moderation", icon: Shield },
    { path: "/admin/leads", label: "Leads", icon: Eye },
    { path: "/admin/monitoring", label: "Chat Monitor", icon: MessageSquare },
  ];

  const links = isCustomer ? customerLinks : isSubagent ? subagentLinks : adminLinks;
  const title = isCustomer ? "Customer" : isSubagent ? "Subagent" : "Admin";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-9 bg-gradient-brand rounded-lg flex items-center justify-center shadow-soft">
              <Home className="size-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-sidebar-foreground text-lg leading-tight">
                AI Realty
              </h1>
              <p className="text-xs text-muted-foreground">{title} Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              location.pathname.startsWith(link.path + "/");
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="lg:hidden bg-card border-b border-border h-14 flex items-center justify-between px-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary focus:outline-none"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-display font-semibold text-foreground">AI Realty</span>
            <Badge variant="info" size="sm">
              {title}
            </Badge>
          </div>
          <ThemeToggle />
        </header>

        <div className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-border bg-card/50">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>

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
