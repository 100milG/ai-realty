import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, TrendingUp } from "lucide-react";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const leadTrendData = [
  { date: "Mon", leads: 3 },
  { date: "Tue", leads: 5 },
  { date: "Wed", leads: 4 },
  { date: "Thu", leads: 8 },
  { date: "Fri", leads: 10 },
  { date: "Sat", leads: 7 },
  { date: "Sun", leads: 6 },
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

export function LeadVisibility() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");
  const themeColors = useThemeColors();

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/leads`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((lead: any) => ({
          id: lead.id,
          customer: lead.customer?.name || "Customer",
          customerEmail: lead.customer?.email || "",
          property: lead.property?.title || "Property",
          propertyPrice: lead.property?.price ? `₹${lead.property.price.toLocaleString()}` : "N/A",
          agent: lead.subagent?.name || "Unassigned",
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          interactions: lead.isUnlocked ? 15 : 2, // Placeholder interaction metrics
        }));
        setLeads(formatted);
      }
    } catch (err) {
      console.error("Error loading platform leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadLeads();
  }, [token, navigate]);

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = filter === "all" || lead.status === filter;
    const matchesSearch = lead.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.agent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalLeadsCount = leads.length;
  const activeLeadsCount = leads.filter((l) => l.status !== "LOST" && l.status !== "CONVERTED").length;
  const closedLeadsCount = leads.filter((l) => l.status === "CONVERTED").length;
  const avgInteractions = totalLeadsCount > 0 
    ? Math.round(leads.reduce((sum, l) => sum + l.interactions, 0) / totalLeadsCount)
    : 0;

  return (
    <div className="p-8 bg-background min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Lead Visibility Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track all customer-agent interactions and lead ownership</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{totalLeadsCount}</p>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <p className="text-sm text-muted-foreground">Active Leads</p>
            <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{activeLeadsCount}</p>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <p className="text-sm text-muted-foreground">Avg. Interactions</p>
            <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{avgInteractions}</p>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <p className="text-sm text-muted-foreground">Closed (Converted)</p>
            <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{closedLeadsCount}</p>
          </div>
        </div>

        {/* Lead Trend */}
        <Card>
          <h2 className="text-xl font-semibold text-foreground mb-6">Lead Creation Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadTrendData}>
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
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Leads" },
            { key: "NEW", label: "New" },
            { key: "CONTACTED", label: "Contacted" },
            { key: "QUALIFIED", label: "Qualified" },
            { key: "CONVERTED", label: "Converted" },
            { key: "LOST", label: "Lost" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className={`lg:col-span-2 space-y-3 ${selectedLead ? "hidden lg:block" : "block"}`}>
            {/* Search */}
            <div className="flex items-center glass rounded-xl shadow-soft px-4 py-2">
              <Search className="size-5 text-muted-foreground mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, agent, or property..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Leads */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl shadow-soft">
                <p className="text-muted-foreground">No leads found in this view.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`glass rounded-2xl shadow-soft p-4 cursor-pointer transition-all ${
                    selectedLead?.id === lead.id
                      ? "ring-2 ring-primary/50"
                      : "hover:shadow-elevated"
                  }`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{lead.customer}</h3>
                      <p className="text-sm text-muted-foreground">{lead.property}</p>
                    </div>
                    <Badge
                      variant={
                        lead.status === "NEW" ? "info" :
                        lead.status === "CONTACTED" ? "warning" :
                        lead.status === "QUALIFIED" ? "success" :
                        lead.status === "CONVERTED" ? "accent" :
                        "default"
                      }
                      size="sm"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Agent</p>
                      <p className="text-foreground">{lead.agent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interactions</p>
                      <p className="text-foreground">{lead.interactions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Activity</p>
                      <p className="text-foreground">{new Date(lead.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lead Details */}
          <div className={`glass rounded-2xl shadow-soft p-6 ${selectedLead ? "block" : "hidden lg:block"}`}>
            {selectedLead ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-semibold text-foreground">Lead Details</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-foreground font-medium">{selectedLead.customer}</p>
                      <p className="text-xs text-muted-foreground">{selectedLead.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Property</p>
                      <p className="text-foreground font-medium">{selectedLead.property}</p>
                      <p className="text-xs text-muted-foreground">Valued at {selectedLead.propertyPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Agent</p>
                      <p className="text-foreground font-medium">{selectedLead.agent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          selectedLead.status === "NEW" ? "info" :
                          selectedLead.status === "CONTACTED" ? "warning" :
                          selectedLead.status === "QUALIFIED" ? "success" :
                          selectedLead.status === "CONVERTED" ? "accent" :
                          "default"
                        }
                      >
                        {selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-3">Interaction Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Interactions</span>
                      <span className="text-foreground font-semibold">{selectedLead.interactions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-foreground font-semibold">{new Date(selectedLead.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Activity</span>
                      <span className="text-foreground font-semibold">{new Date(selectedLead.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-3">Ownership & Platform Auditing</h3>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This lead is owned by <span className="text-foreground font-medium">{selectedLead.agent}</span>. Communication transcripts are captured by compliance guards and viewable under Chat Monitoring.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a lead to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
