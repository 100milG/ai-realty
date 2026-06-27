import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, MessageSquare, Eye, Clock, Sparkles } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { PropertyCard } from "../../components/PropertyCard";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { formatPriceCompact } from "../../lib/format";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const token = localStorage.getItem("token");
  let customerName = "there";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      customerName = payload.name?.split(" ")[0] || "there";
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
        const headers = { Authorization: `Bearer ${token}` };

        const [leadsRes, savedRes, propertiesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/leads`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/saved-properties`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/properties?status=ACTIVE`),
        ]);

        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (savedRes.ok) setSavedProperties(await savedRes.json());
        if (propertiesRes.ok) {
          const data = await propertiesRes.json();
          setProperties(data.slice(0, 2));
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-sm font-medium text-accent uppercase tracking-wider mb-1">Welcome back</p>
          <h1 className="text-foreground">Hello, {customerName}</h1>
          <p className="text-muted-foreground mt-1">Here's your property search at a glance</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Saved Properties"
            value={savedProperties.length}
            icon={Heart}
            iconBgColor="bg-red-500/10"
            iconColor="text-red-500"
          />
          <StatCard
            title="Active Leads"
            value={leads.length}
            icon={MessageSquare}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            title="Properties Viewed"
            value="14"
            icon={Eye}
            iconBgColor="bg-accent/15"
            iconColor="text-accent"
          />
          <StatCard
            title="AI Matches"
            value={properties.length}
            icon={Sparkles}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-xl font-display font-semibold text-foreground">AI Recommendations</h2>
            </div>
            <Link to="/customer/search">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          {properties.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recommendations available yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  image={
                    property.media?.[0]?.url ||
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
                  }
                  price={formatPriceCompact(property.price)}
                  title={property.title}
                  location={
                    property.address ||
                    (property.locality
                      ? `${property.locality.name}, ${property.locality.city}`
                      : "Unknown")
                  }
                  beds={property.beds || 0}
                  baths={property.baths || 0}
                  sqft={property.sqft || 0}
                  aiScore={95}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                Active Conversations
              </h2>
              {leads.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No active conversations yet.</p>
                  <Link to="/customer/search">
                    <Button variant="outline" size="sm">
                      Search Properties
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <Link key={lead.id} to={`/customer/chat/${lead.id}`}>
                      <div className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {lead.property?.title || "Property"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Agent: {lead.subagent?.name || "Verified Agent"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              lead.status === "NEW"
                                ? "info"
                                : lead.status === "QUALIFIED"
                                  ? "success"
                                  : "warning"
                            }
                            size="sm"
                          >
                            {lead.status === "NEW" ? "New" : lead.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Tap to open secure chat</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {leads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No recent activity.</p>
                ) : (
                  leads.slice(0, 4).map((lead, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="size-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Inquiry for{" "}
                          <span className="font-medium">{lead.property?.title || "Property"}</span>
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Clock className="size-3 mr-1" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-display font-semibold text-foreground mb-3">Your Preferences</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="ai" size="sm">
                  Modern Architecture
                </Badge>
                <Badge variant="ai" size="sm">
                  3-4 Bedrooms
                </Badge>
                <Badge variant="ai" size="sm">
                  Good Schools
                </Badge>
                <Badge variant="ai" size="sm">
                  ₹80L – ₹1.2Cr
                </Badge>
              </div>
              <Link to="/customer/ai-chat">
                <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                  <Sparkles className="size-4" />
                  Update via AI
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
