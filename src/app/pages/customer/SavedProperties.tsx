import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Search, Home } from "lucide-react";
import { PropertyCard } from "../../components/PropertyCard";
import { Button } from "../../components/Button";

export function SavedProperties() {
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadSavedProperties() {
      setLoading(true);
      try {
        const res = await fetch("/api/saved-properties", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedProperties(data);
        } else {
          console.error("Failed to load saved properties");
        }
      } catch (err) {
        console.error("Error fetching saved properties:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedProperties();
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Heart className="size-8 text-red-500 mr-3 fill-red-500 animate-pulse" />
            Saved Properties
          </h1>
          <p className="text-gray-600 mt-1">Keep track of your favorite properties and listings</p>
        </div>

        {/* Content */}
        {savedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto mt-12 shadow-sm">
            <Heart className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Properties</h3>
            <p className="text-gray-600 mb-6">
              You haven't saved any listings yet. Explore properties on the search page and click the heart icon to save them here!
            </p>
            <Link to="/customer/search">
              <Button>
                <Search className="size-4 mr-2" />
                Browse Properties
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property) => {
              const imageUrl = property.media && property.media[0] 
                ? property.media[0].url 
                : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
              const formattedPrice = property.price 
                ? `₹${property.price.toLocaleString()}` 
                : "Contact Agent";
              const propertyLocation = property.address || 
                (property.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");

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
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
