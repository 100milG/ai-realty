import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Users, MessageSquare, Eye, CheckCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SubagentDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm("Are you sure you want to delete this property listing?")) {
      return;
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setMyProperties(prev => prev.filter(p => p.id !== propertyId));
        alert("Property deleted successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete property.");
      }
    } catch (err) {
      console.error("Error deleting property:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const token = localStorage.getItem("token");
  let subagentName = "Raj Patel";
  let currentUserId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      subagentName = payload.name || "Raj Patel";
      currentUserId = payload.id;
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch subagent leads
        const leadsRes = await fetch(`${import.meta.env.VITE_API_URL}/leads`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const leadsData = await leadsRes.json();
        if (leadsRes.ok) {
          setLeads(leadsData);
        }

        // 2. Fetch only subagent properties directly
        const propertiesRes = await fetch(`${import.meta.env.VITE_API_URL}/properties?myListings=true&status=all`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const propertiesData = await propertiesRes.json();
        if (propertiesRes.ok) {
          setMyProperties(propertiesData);
        }
      } catch (err) {
        console.error("Error loading subagent dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [token, currentUserId]);

  const performanceData = [
    { month: "Jan", leads: 12, views: 45 },
    { month: "Feb", leads: 18, views: 62 },
    { month: "Mar", leads: 22, views: 78 },
    { month: "Apr", leads: 28, views: 95 },
    { month: "May", leads: leads.length, views: 108 },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingApprovals = myProperties.filter((p) => p.status === "PENDING_APPROVAL").length;

  return (
      <div className="p-4 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-display">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {subagentName}! Track your property listings and leads</p>
          </div>
          <Link to="/subagent/properties/add">
            <Button size="lg">
              <Building2 className="size-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            title="Total Properties"
            value={myProperties.length.toString()}
            icon={Building2}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
            trend={{ value: "+1 this month", positive: true }}
          />
          <StatCard
            title="Active Leads"
            value={leads.length.toString()}
            icon={Users}
            iconBgColor="bg-accent/10"
            iconColor="text-accent"
            trend={{ value: `+${leads.length} total`, positive: true }}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingApprovals.toString()}
            icon={Clock}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
          />
          <StatCard
            title="Total Views"
            value="345"
            icon={Eye}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-500"
            trend={{ value: "+12% vs last month", positive: true }}
          />
        </div>

        {/* Performance Chart */}
        <Card>
          <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Performance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="leads" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="views" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="size-3 bg-primary rounded mr-2" />
              <span className="text-sm text-muted-foreground">Leads</span>
            </div>
            <div className="flex items-center">
              <div className="size-3 bg-accent rounded mr-2" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <div className="lg:col-span-1">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-display">Recent Leads</h2>
                <Link to="/subagent/leads">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              {leads.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No leads assigned yet.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {leads.map((lead) => {
                    const customerName = lead.customer?.name || "Customer";
                    const propertyTitle = lead.property?.title || "Property";
                    const initials = customerName.split(" ").map((n: string) => n[0]).join("");

                    return (
                      <Link key={lead.id} to={`/subagent/leads`}>
                        <div
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="size-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{customerName}</p>
                              <p className="text-sm text-muted-foreground">{propertyTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                lead.status === "NEW" ? "info" :
                                lead.status === "CONTACTED" ? "warning" :
                                "success"
                              }
                              size="sm"
                            >
                              {lead.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Top Performing Properties */}
          <div>
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Listed Properties</h2>
              {myProperties.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No listed properties.</p>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {myProperties.map((property) => (
                    <div key={property.id} className="pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{property.title}</span>
                        <Badge
                          variant={property.status === "ACTIVE" ? "success" : property.status === "PENDING_APPROVAL" ? "warning" : "default"}
                          size="sm"
                        >
                          {property.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Eye className="size-4 mr-1" />
                            115
                          </div>
                          <div className="flex items-center">
                            <Users className="size-4 mr-1" />
                            Active
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link to={`/subagent/properties/edit/${property.id}`}>
                            <button className="p-1 text-gray-500 hover:text-primary transition-colors cursor-pointer" title="Edit Property">
                              <Edit2 className="size-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(property.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Delete Property"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/subagent/properties/add">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer text-center">
                <Building2 className="size-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Add New Property</p>
                <p className="text-sm text-gray-600">List a new property</p>
              </div>
            </Link>
            <Link to="/subagent/leads">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer text-center">
                <MessageSquare className="size-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">View All Leads</p>
                <p className="text-sm text-gray-600">Manage your leads</p>
              </div>
            </Link>
            <Link to="/subagent/kyc">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer text-center">
                <CheckCircle className="size-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Complete KYC</p>
                <p className="text-sm text-gray-600">Verify your account</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
