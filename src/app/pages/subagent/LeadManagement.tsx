import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, MessageSquare, Phone, Mail, Clock, KeyRound } from "lucide-react";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function LeadManagement() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/leads`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleUnlockLead = async (leadId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/leads/${leadId}/unlock`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, isUnlocked: true } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => ({ ...prev, isUnlocked: true }));
        }
        alert("Lead contact details unlocked successfully!");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to unlock lead.");
      }
    } catch (err) {
      console.error("Error unlocking lead:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/leads/${leadId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = filter === "all" || lead.status === filter;
    const customerName = lead.customer?.name || "";
    const propertyTitle = lead.property?.title || "";
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: leads.length,
    NEW: leads.filter((l) => l.status === "NEW").length,
    CONTACTED: leads.filter((l) => l.status === "CONTACTED").length,
    QUALIFIED: leads.filter((l) => l.status === "QUALIFIED").length,
    CONVERTED: leads.filter((l) => l.status === "CONVERTED").length,
    LOST: leads.filter((l) => l.status === "LOST").length,
  };

  const getTimeline = (lead: any) => {
    const events = [];
    events.push({ event: "Lead created", time: new Date(lead.createdAt).toLocaleString() });
    if (lead.status !== "NEW") {
      events.push({ event: `Status updated to ${lead.status}`, time: new Date(lead.updatedAt).toLocaleString() });
    }
    if (lead.isUnlocked) {
      events.push({ event: "Contact details unlocked by agent", time: "Fee verified" });
    }
    return events;
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your customer leads</p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Leads" },
            { key: "NEW", label: "New" },
            { key: "CONTACTED", label: "Contacted" },
            { key: "QUALIFIED", label: "Qualified" },
            { key: "CONVERTED", label: "Converted" },
            { key: "LOST", label: "Lost" },
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setFilter(status.key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status.key
                  ? "bg-primary text-white"
                  : "bg-card text-foreground hover:bg-secondary border border-border"
              }`}
            >
              {status.label} ({statusCounts[status.key as keyof typeof statusCounts]})
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className={`lg:col-span-2 space-y-4 ${selectedLead ? "hidden lg:block" : "block"}`}>
            {/* Search */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 flex items-center bg-card border border-border rounded-lg px-4 py-2">
                <Search className="size-5 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search leads by name or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-foreground"
                />
              </div>
              <Button variant="outline">
                <Filter className="size-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Leads */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No leads found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const customerName = lead.customer?.name || "Customer";
                  const propertyTitle = lead.property?.title || "Property";
                  const initials = customerName.split(" ").map((n: string) => n[0]).join("");
                  
                  return (
                    <Card
                      key={lead.id}
                      padding={false}
                      hover
                      className={`cursor-pointer ${
                        selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {initials}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{customerName}</h3>
                              <p className="text-sm text-muted-foreground">{propertyTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
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
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="size-4 mr-2" />
                            Created {new Date(lead.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MessageSquare className="size-4 mr-2" />
                            Status: {lead.status}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lead Details Sidebar */}
          <div className={`${selectedLead ? "block" : "hidden lg:block"}`}>
            {selectedLead ? (
              <Card>
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                        >
                          ← Back
                        </button>
                        <h2 className="text-xl font-semibold text-foreground">Lead Details</h2>
                      </div>
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
                    <div className="flex items-center space-x-3">
                      <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                        {(selectedLead.customer?.name || "Customer").split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{selectedLead.customer?.name || "Customer"}</h3>
                        <p className="text-sm text-muted-foreground">{selectedLead.property?.title || "Property"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                      <Mail className="size-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground truncate">
                          {selectedLead.isUnlocked ? (selectedLead.customer?.email || "No Email") : "••••••••••••"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                      <Phone className="size-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm text-foreground">
                          {selectedLead.isUnlocked ? (selectedLead.customer?.phone || "No Phone") : "••••••••••••"}
                        </p>
                      </div>
                    </div>

                    {!selectedLead.isUnlocked && (
                      <Button
                        className="w-full flex items-center justify-center gap-2 mt-2"
                        variant="success"
                        onClick={() => handleUnlockLead(selectedLead.id)}
                      >
                        <KeyRound className="size-4" />
                        Unlock Contact Info
                      </Button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground mb-3">Timeline</h3>
                    <div className="space-y-3">
                      {getTimeline(selectedLead).map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="size-2 bg-primary rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{item.event}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground">Actions</h3>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">Update Status</label>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => navigate(`/subagent/chat/${selectedLead.id}`)}
                    >
                      <MessageSquare className="size-4 mr-2" />
                      Open Chat
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <MessageSquare className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a lead to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
