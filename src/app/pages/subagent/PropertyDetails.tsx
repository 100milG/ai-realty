import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Car,
  CheckCircle2,
  School,
  ShoppingCart,
  Coffee,
  Train,
  ArrowLeft
} from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { formatPriceCompact } from "../../lib/format";

export function SubagentPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProperty(data);
        } else {
          console.error("Property not found");
        }
      } catch (err) {
        console.error("Failed to load property details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPropertyDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-20">
        <p className="text-muted-foreground text-lg mb-4">Property not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const images = property.media && property.media.length > 0
    ? property.media.map((m: any) => m.url)
    : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"];

  const formattedPrice = formatPriceCompact(property.price);
  const propertyLocation = property.address || (property.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");
  const amenities = property.amenities?.map((a: any) => a.amenity.name) || [];
  const hasGarage = amenities.some((name: string) => name.toLowerCase().includes("garage")) ? "Yes" : "No";

  const nearbyPlaces: any[] = [];
  if (property.locality?.poi) {
    const poi = typeof property.locality.poi === "string"
      ? JSON.parse(property.locality.poi)
      : property.locality.poi;
    
    if (poi && typeof poi === "object") {
      if (Array.isArray(poi.schools)) {
        poi.schools.forEach((s: string) => nearbyPlaces.push({ name: s, icon: School, distance: "0.5 miles" }));
      }
      if (Array.isArray(poi.parks)) {
        poi.parks.forEach((p: string) => nearbyPlaces.push({ name: p, icon: Coffee, distance: "0.2 miles" }));
      }
      if (Array.isArray(poi.transport)) {
        poi.transport.forEach((t: string) => nearbyPlaces.push({ name: t, icon: Train, distance: "0.4 miles" }));
      }
      if (Array.isArray(poi.shopping)) {
        poi.shopping.forEach((sh: string) => nearbyPlaces.push({ name: sh, icon: ShoppingCart, distance: "0.6 miles" }));
      }
      if (Array.isArray(poi.dining)) {
        poi.dining.forEach((d: string) => nearbyPlaces.push({ name: d, icon: Coffee, distance: "0.3 miles" }));
      }
    }
  }

  if (nearbyPlaces.length === 0) {
    nearbyPlaces.push(
      { name: "Central Park", icon: Coffee, distance: "0.5 miles" },
      { name: "Downtown School", icon: School, distance: "1.2 miles" }
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Image Gallery */}
      <div className="bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="relative h-64 sm:h-[400px] lg:h-[500px]">
            <img
              src={images[currentImage]}
              alt={property.title}
              className="size-full object-cover"
            />
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <button
                onClick={() => navigate(-1)}
                className="size-10 bg-white/90 dark:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="size-5 text-gray-900 dark:text-white" />
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`size-2 rounded-full transition-all ${
                    currentImage === index ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 p-2 max-w-5xl mx-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-16 sm:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImage === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={image} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="size-5 mr-2" />
                    {propertyLocation}
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-bold text-foreground font-numeric">{formattedPrice}</p>
                  <div className="mt-2">
                    <Badge variant="info" size="sm">
                    {property.listingType === "RENT" ? "For Rent" : "For Sale"}
                  </Badge>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Bed className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold font-numeric">{property.beds || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Bath className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold font-numeric">{property.baths || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Maximize className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sqft</p>
                    <p className="font-semibold font-numeric">{property.sqft || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Garage</p>
                    <p className="font-semibold">{hasGarage}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <h3 className="font-semibold text-foreground mb-3">About this property</h3>
              <p className="text-muted-foreground leading-relaxed">{property.description || "No description available."}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-medium capitalize">{property.propertyType.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year Built</p>
                  <p className="font-medium">{property.yearBuilt || "N/A"}</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Amenities */}
              {amenities.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-foreground mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle2 className="size-5 text-accent mr-2" />
                        <span className="text-muted-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Nearby Places */}
              <Card>
                <h3 className="font-semibold text-foreground mb-4">Nearby Places</h3>
                <div className="space-y-3">
                  {nearbyPlaces.map((place: any, index: number) => {
                    const Icon = place.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center">
                          <div className="size-10 bg-card rounded-lg flex items-center justify-center mr-3 shadow-soft">
                            <Icon className="size-5 text-primary" />
                          </div>
                          <span className="text-foreground">{place.name}</span>
                        </div>
                        <Badge variant="default" size="sm">{place.distance}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar (Subagent Command Center) */}
          <div className="space-y-6">
            {/* Quick Actions & Status */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Property Status</h3>
                <Badge variant={property.status === "ACTIVE" ? "success" : property.status === "PENDING_APPROVAL" ? "warning" : "default"} size="sm">
                  {property.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Manage this listing or track incoming buyer requests.</p>
              
              <div className="space-y-3">
                <Link to={`/subagent/properties/edit/${property.id}`} className="block">
                  <Button className="w-full" variant="outline">
                    Edit Property
                  </Button>
                </Link>
                <Link to="/subagent/leads" className="block">
                  <Button className="w-full" variant="outline">
                    View Connected Leads
                  </Button>
                </Link>
                <Button className="w-full text-destructive hover:bg-destructive hover:text-white transition-colors" variant="outline">
                  Delete Listing
                </Button>
              </div>
            </Card>

            {/* Performance Funnel */}
            <Card>
              <h3 className="font-semibold text-foreground mb-4">Performance Funnel</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Listing Views</span>
                    <span className="font-medium">1,245</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Property Saves</span>
                    <span className="font-medium">182</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Active Leads</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '3%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Insights */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
              <h3 className="font-semibold text-foreground mb-3">Market Insights</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg. Locality Price</span>
                <span className="text-sm font-semibold">₹1.2 Cr</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">This Property</span>
                <span className="text-sm font-semibold">{formattedPrice}</span>
              </div>
              <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/10">
                <p className="text-xs text-primary font-medium">
                  This listing is priced 15% lower than the neighborhood average. Expect high lead volume.
                </p>
              </div>
            </Card>

            {/* Marketing Tools */}
            <Card>
              <h3 className="font-semibold text-foreground mb-3">Marketing Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">Generate assets to share this property on social networks.</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Download Flyer
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Share to Socials
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
