import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Plus, Edit2, Trash2, Eye, Search, Filter } from "lucide-react";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmationModal } from "../../components/ConfirmationModal";

export function PropertyManagement() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token");
  let currentUserId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id;
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }

  const loadProperties = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/properties?myListings=true&status=all`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [token, currentUserId]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const confirmDeleteProperty = (id: string) => {
    setPropertyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    const id = propertyToDelete;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setProperties(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete property listing.");
      }
    } catch (err) {
      console.error("Error deleting property:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Management</h1>
            <p className="text-muted-foreground mt-1">Add, edit, delete, and manage your listings</p>
          </div>
          <Link to="/subagent/properties/add">
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="flex-1 flex items-center bg-secondary/50 rounded-lg px-4 py-2 border border-border">
            <Search className="size-5 text-muted-foreground mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by title or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm w-full text-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap flex items-center">
              <Filter className="size-4 mr-1 text-muted-foreground" /> Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </select>
          </div>
        </div>

        {/* Listings Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-card rounded-2xl border border-border shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-16 text-center max-w-xl mx-auto shadow-sm">
            <Building2 className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Listed</h3>
            <p className="text-muted-foreground mb-6">
              You haven't listed any properties matching the filter. Start list your first property to find buyers!
            </p>
            <Link to="/subagent/properties/add">
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="size-4" />
                Add Your First Property
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Locality</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredProperties.map((property) => {
                    const imageUrl = property.media && property.media[0] 
                      ? property.media[0].url 
                      : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100";
                    const formattedPrice = property.price 
                      ? `₹ ${property.price.toLocaleString()}` 
                      : "Contact Agent";
                    const propertyLocation = property.address || (property.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");

                    return (
                      <tr key={property.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={imageUrl}
                              alt=""
                              className="size-12 rounded-lg object-cover flex-shrink-0 border border-border"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate max-w-xs">{property.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{propertyLocation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground/80">
                          {property.locality?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground font-numeric">
                          {formattedPrice}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="default" size="sm">
                            {property.listingType} - {property.propertyType}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              property.status === "ACTIVE" ? "success" :
                              property.status === "PENDING_APPROVAL" ? "warning" :
                              property.status === "REJECTED" ? "danger" :
                              "info"
                            }
                            size="sm"
                          >
                            {property.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link to={`/subagent/property/${property.id}`} title="Preview Property">
                              <button className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                                <Eye className="size-4" />
                              </button>
                            </Link>
                            <Link to={`/subagent/properties/edit/${property.id}`} title="Edit Property">
                              <button className="p-2 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer">
                                <Edit2 className="size-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => confirmDeleteProperty(property.id)}
                              className="p-2 text-muted-foreground hover:text-white hover:bg-destructive active:bg-destructive-hover rounded-lg transition-colors cursor-pointer"
                              title="Delete Property"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Property Listing"
        message="Are you sure you want to permanently delete this property listing? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteProperty}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPropertyToDelete(null);
        }}
      />
    </div>
  );
}
