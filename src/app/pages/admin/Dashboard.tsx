import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Building2, MessageSquare, Clock, Shield, TrendingUp } from "lucide-react";
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/stats", {
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
      <div className="p-8 bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-3xl font-semibold text-white mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-green-400 mt-2">↑ Active Profiles</p>
              </div>
              <div className="size-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="size-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Properties</p>
                <p className="text-3xl font-semibold text-white mt-2">{stats.totalProperties}</p>
                <p className="text-sm text-green-400 mt-2">↑ Database Catalog</p>
              </div>
              <div className="size-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="size-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Subagents</p>
                <p className="text-3xl font-semibold text-white mt-2">{stats.totalSubagents}</p>
                <p className="text-sm text-purple-400 mt-2">Verify Listings</p>
              </div>
              <div className="size-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="size-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Approvals</p>
                <p className="text-3xl font-semibold text-white mt-2">{stats.totalPendingApprovals}</p>
                <p className="text-sm text-yellow-400 mt-2">Verification Queue</p>
              </div>
              <div className="size-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="size-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Platform Activity (Weekly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "white",
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
                <span className="text-sm text-gray-400">Users</span>
              </div>
              <div className="flex items-center">
                <div className="size-3 bg-green-500 rounded mr-2" />
                <span className="text-sm text-gray-400">Properties</span>
              </div>
              <div className="flex items-center">
                <div className="size-3 bg-purple-500 rounded mr-2" />
                <span className="text-sm text-gray-400">Leads</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Listing Moderation status</h2>
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
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="size-3 rounded mr-2" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Activity Logs</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No recent logs.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-700 last:border-0">
                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/20`}>
                      <Clock className="size-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Pending Approvals Queue</h2>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Approvals queue is clear.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={item.type === "Subagent" ? "info" : "warning"} size="sm">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(item.submitted).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium">{item.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
