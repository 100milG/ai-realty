import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, X, Flag, Eye } from "lucide-react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function PropertyModeration() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "pending" | "rejected">("pending");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const token = localStorage.getItem("token");

  const loadProperties = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/properties`;
      if (filter === "pending") {
        url = `${import.meta.env.VITE_API_URL}/properties?status=PENDING_APPROVAL`;
      } else if (filter === "rejected") {
        url = `${import.meta.env.VITE_API_URL}/properties?status=REJECTED`;
      }
      
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Error fetching properties for moderation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadProperties();
  }, [filter, token, navigate]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "ACTIVE" })
      });
      if (res.ok) {
        alert("Property approved successfully! It is now ACTIVE and searchable by clients.");
        setProperties(prev => prev.filter(p => p.id !== id));
        setSelectedProperty(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to approve property.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "REJECTED" })
      });
      if (res.ok) {
        alert("Property listing rejected.");
        setProperties(prev => prev.filter(p => p.id !== id));
        setSelectedProperty(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reject property.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Property Moderation</h1>
          <p className="text-gray-400 mt-1">Review and approve property listings submitted by agents</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {[
            { key: "pending", label: "Pending Approval" },
            { key: "all", label: "All Active Listings" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Properties List */}
          <div className={`lg:col-span-2 space-y-4 ${selectedProperty ? "hidden lg:block" : "block"}`}>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20 bg-gray-855 border border-gray-700 rounded-xl">
                <p className="text-gray-400">No properties found in this tab.</p>
              </div>
            ) : (
              properties.map((property) => {
                const coverImage = property.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400";
                const formattedPrice = property.price ? `₹${property.price.toLocaleString()}` : "Contact Agent";
                const propertyLocation = property.address || (property.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");
                const agentRelation = property.agents?.[0];
                const agentName = agentRelation?.subagent?.name || "Raj Patel";
                const formattedTime = new Date(property.createdAt).toLocaleDateString();

                return (
                  <div
                    key={property.id}
                    className={`bg-gray-800 rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      selectedProperty?.id === property.id
                        ? "border-blue-500 ring-2 ring-blue-500/50"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <img
                        src={coverImage}
                        alt={property.title}
                        className="w-full sm:w-48 h-48 object-cover"
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{property.title}</h3>
                            <p className="text-sm text-gray-400">{propertyLocation}</p>
                          </div>
                          <Badge variant={property.status === "ACTIVE" ? "success" : property.status === "PENDING_APPROVAL" ? "warning" : "danger"} size="sm">
                            {property.status}
                          </Badge>
                        </div>

                        <p className="text-2xl font-bold text-white mb-3 font-numeric">{formattedPrice}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                          <span>{property.beds || 0} beds</span>
                          <span>{property.baths || 0} baths</span>
                          <span>{property.sqft || 0} sqft</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                          <div>
                            <p className="text-xs text-gray-400">Listed by {agentName}</p>
                            <p className="text-xs text-gray-500">{formattedTime}</p>
                          </div>
                          {property.status === "PENDING_APPROVAL" && (
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleApprove(property.id)}
                              >
                                <CheckCircle className="size-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(property.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Property Details */}
          <div className={`bg-gray-800 rounded-xl border border-gray-700 p-6 ${selectedProperty ? "block" : "hidden lg:block"}`}>
            {selectedProperty ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setSelectedProperty(null)}
                      className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-semibold text-white">Property Details</h2>
                  </div>
                  <img
                    src={selectedProperty.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400"}
                    alt={selectedProperty.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-semibold text-white text-lg mb-2">{selectedProperty.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    {selectedProperty.address || (selectedProperty.locality ? `${selectedProperty.locality.name}, ${selectedProperty.locality.city}` : "Unknown Locality")}
                  </p>
                  <p className="text-3xl font-bold text-white mb-4 font-numeric">
                    {selectedProperty.price ? `₹${selectedProperty.price.toLocaleString()}` : "Contact Agent"}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 pb-4 border-b border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400">Bedrooms</p>
                    <p className="text-lg font-semibold text-white font-numeric">{selectedProperty.beds || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Bathrooms</p>
                    <p className="text-lg font-semibold text-white">{selectedProperty.baths || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sqft</p>
                    <p className="text-lg font-semibold text-white">{selectedProperty.sqft || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Year Built</p>
                    <p className="text-lg font-semibold text-white">{selectedProperty.yearBuilt || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Description</h4>
                  <p className="text-sm text-gray-400">{selectedProperty.description || "No description available."}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Listed By</h4>
                  <p className="text-sm text-gray-400">{selectedProperty.agents?.[0]?.subagent?.name || "Verified Agent"}</p>
                  <p className="text-xs text-gray-500">{new Date(selectedProperty.createdAt).toLocaleDateString()}</p>
                </div>

                {selectedProperty.status === "PENDING_APPROVAL" && (
                  <div className="space-y-2">
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => handleApprove(selectedProperty.id)}
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Approve Property
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
                      onClick={() => handleReject(selectedProperty.id)}
                    >
                      <X className="size-4 mr-2" />
                      Reject Listing
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="size-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a property to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
