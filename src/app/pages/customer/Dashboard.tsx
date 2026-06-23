import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, MessageSquare, Eye, Clock, Sparkles, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { PropertyCard } from "../../components/PropertyCard";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const token = localStorage.getItem("token");
  let customerName = "Sarah Johnson";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Try to get name from token payload, default to Sarah
      customerName = payload.name || "Sarah Johnson";
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
        // 1. Fetch leads
        const leadsRes = await fetch("/api/leads", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeads(leadsData);
        }

        // 2. Fetch saved properties
        const savedRes = await fetch("/api/saved-properties", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedProperties(savedData);
        }

        // 3. Fetch active properties for recommendations
        const propertiesRes = await fetch("/api/properties?status=ACTIVE");
        if (propertiesRes.ok) {
          const propertiesData = await propertiesRes.json();
          setProperties(propertiesData);
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
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {customerName}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your property search</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard
            title="Saved Properties"
            value={savedProperties.length.toString()}
            icon={Heart}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
          <StatCard
            title="Active Leads"
            value={leads.length.toString()}
            icon={MessageSquare}
            iconBgColor="bg-blue-100"
            iconColor="text-primary"
          />
          <StatCard
            title="Properties Viewed"
            value="14"
            icon={Eye}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            title="AI Recommendations"
            value={properties.length.toString()}
            icon={Sparkles}
            iconBgColor="bg-green-100"
            iconColor="text-accent"
          />
        </div>

        {/* AI Recommendations */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="size-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900">AI Recommendations For You</h2>
            </div>
            <Link to="/customer/search">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {properties.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No recommendations available.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {properties.map((property) => {
                const imageUrl = property.media && property.media[0] ? property.media[0].url : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
                const formattedPrice = property.price ? `₹${property.price.toLocaleString()}` : "Contact Agent";
                const propertyLocation = property.address || (property.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");

                return (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    image={imageUrl}
                    price={formattedPrice}
                    title={property.title}
                    location={propertyLocation}
                    beds={property.beds || 0}
                    baths={property.baths || 0}
                    sqft={property.sqft || 0}
                    aiScore={95}
                  />
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Leads */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Conversations</h2>
              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active conversations.</p>
                  <Link to="/customer/search" className="mt-2 inline-block">
                    <Button variant="outline" size="sm">Search Properties</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => {
                    const propertyTitle = lead.property?.title || "Property";
                    const agentName = lead.subagent?.name || "Verified Agent";
                    const statusText = lead.status === "NEW" ? "New inquiry" : lead.status;

                    return (
                      <Link key={lead.id} to={`/customer/chat/${lead.id}`}>
                        <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{propertyTitle}</h3>
                              <p className="text-sm text-gray-600">Agent: {agentName}</p>
                            </div>
                            <Badge
                              variant={lead.status === "NEW" ? "info" : lead.status === "QUALIFIED" ? "success" : "warning"}
                              size="sm"
                            >
                              {statusText}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">Click to enter secure chat room</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {leads.map((lead, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                      <MessageSquare className="size-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Inquiry created for <span className="font-medium">{lead.property?.title || "Property"}</span>
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="size-3 mr-1" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity.</p>
                )}
              </div>
            </Card>

            <Card className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Preferences</h3>
              <div className="space-y-2">
                <Badge variant="ai" size="sm">Modern Architecture</Badge>
                <Badge variant="ai" size="sm">3-4 Bedrooms</Badge>
                <Badge variant="ai" size="sm">Good Schools</Badge>
                <Badge variant="ai" size="sm">$800K - $900K</Badge>
              </div>
              <Link to="/customer/ai-chat">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Sparkles className="size-4 mr-2" />
                  Update Preferences
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
