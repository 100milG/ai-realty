import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Search } from "lucide-react";
import { PropertyCard } from "../../components/PropertyCard";
import { Button } from "../../components/Button";
import { formatPriceCompact } from "../../lib/format";

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/saved-properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSavedProperties(await res.json());
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
      <div className="p-8 min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Heart className="size-7 text-red-500 fill-red-500" />
            <h1 className="text-foreground">Saved Properties</h1>
          </div>
          <p className="text-muted-foreground">
            {savedProperties.length > 0
              ? `${savedProperties.length} listing${savedProperties.length === 1 ? "" : "s"} saved for later`
              : "Your shortlist of favourite homes"}
          </p>
        </div>

        {savedProperties.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center max-w-lg mx-auto shadow-soft">
            <div className="size-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Heart className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">Nothing saved yet</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Browse listings and tap the heart icon to build your shortlist.
            </p>
            <Link to="/customer/search">
              <Button className="gap-2">
                <Search className="size-4" />
                Browse Properties
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
