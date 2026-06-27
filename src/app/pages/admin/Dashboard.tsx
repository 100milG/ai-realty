import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Building2, MessageSquare, Clock, Shield } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const activityData = [
  { date: "Mon", users: 45, properties: 12, leads: 28 },
  { date: "Tue", users: 52, properties: 15, leads: 35 },
  { date: "Wed", users: 48, properties: 18, leads: 42 },
  { date: "Thu", users: 61, properties: 22, leads: 38 },
  { date: "Fri", users: 55, properties: 19, leads: 45 },
  { date: "Sat", users: 67, properties: 25, leads: 52 },
  { date: "Sun", users: 58, properties: 20, leads: 48 },
];

function useThemeColors() {
  const [colors, setColors] = useState({
    grid: "#374151",
    axis: "#9CA3AF",
    tooltipBg: "#1F2937",
    tooltipBorder: "#374151",
  });

  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      const isDark = document.documentElement.classList.contains("dark");
      setColors({
        grid: isDark ? "rgba(245,242,237,0.1)" : "rgba(28,27,31,0.1)",
        axis: style.getPropertyValue("--muted-foreground").trim() || "#9CA3AF",
        tooltipBg: style.getPropertyValue("--card").trim() || "#1F2937",
        tooltipBorder: isDark ? "rgba(245,242,237,0.1)" : "rgba(28,27,31,0.1)",
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalSubagents: 0,
    totalPendingApprovals: 0
  });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const token = localStorage.getItem("token");
  const themeColors = useThemeColors();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setStatusData(data.statusData);
          setRecentActivity(data.recentActivity);
          setPendingApprovals(data.pendingApprovals);
        }
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="p-8 bg-background min-h-screen text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            trend={{ value: "Active Profiles", positive: true }}
            iconBgColor="bg-blue-500/15"
            iconColor="text-blue-500 dark:text-blue-400"
          />
          <StatCard
            title="Total Properties"
            value={stats.totalProperties}
            icon={Building2}
            trend={{ value: "Database Catalog", positive: true }}
            iconBgColor="bg-emerald-500/15"
            iconColor="text-emerald-500 dark:text-emerald-400"
          />
          <StatCard
            title="Total Subagents"
            value={stats.totalSubagents}
            icon={Shield}
            iconBgColor="bg-purple-500/15"
            iconColor="text-purple-500 dark:text-purple-400"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.totalPendingApprovals}
            icon={Clock}
            trend={{ value: "Verification Queue", positive: false }}
            iconBgColor="bg-amber-500/15"
            iconColor="text-amber-500 dark:text-amber-400"
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">Platform Activity (Weekly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
                <XAxis dataKey="date" stroke={themeColors.axis} />
                <YAxis stroke={themeColors.axis} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeColors.tooltipBg,
                    border: `1px solid ${themeColors.tooltipBorder}`,
                    borderRadius: "8px",
                    color: "inherit",
                  }}
                />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="properties" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div className="size-3 bg-blue-500 rounded mr-2" />
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center">
                <div className="size-3 bg-green-500 rounded mr-2" />
                <span className="text-sm text-muted-foreground">Properties</span>
              </div>
              <div className="flex items-center">
                <div className="size-3 bg-purple-500 rounded mr-2" />
                <span className="text-sm text-muted-foreground">Leads</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-foreground mb-6">Listing Moderation Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeColors.tooltipBg,
                    border: `1px solid ${themeColors.tooltipBorder}`,
                    borderRadius: "8px",
                    color: "inherit",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="size-3 rounded mr-2" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity Logs</h2>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No recent logs.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0">
                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/15`}>
                      <Clock className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Approvals */}
          <Card>
            <h2 className="text-xl font-semibold text-foreground mb-6">Pending Approvals Queue</h2>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Approvals queue is clear.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item, index) => (
                  <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={item.type === "Subagent" ? "info" : "warning"} size="sm">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.submitted).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{item.name}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
