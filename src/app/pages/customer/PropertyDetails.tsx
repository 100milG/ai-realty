import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Car,
  Sparkles,
  Calendar,
  CheckCircle2,
  School,
  ShoppingCart,
  Coffee,
  Train,
  LogOut,
  MessageSquare,
  X
} from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { formatPriceCompact } from "../../lib/format";

export function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProperty(data);

          // Check if this property is in user's saved list
          const token = localStorage.getItem("token");
          if (token) {
            const savedRes = await fetch(`${import.meta.env.VITE_API_URL}/saved-properties`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (savedRes.ok) {
              const savedList = await savedRes.json();
              const isSaved = savedList.some((p: any) => p.id === id);
              setSaved(isSaved);
            }
          }
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

  const handleToggleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please sign in to save properties.");
      navigate("/login");
      return;
    }

    try {
      if (saved) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/saved-properties/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setSaved(false);
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/saved-properties`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ propertyId: id })
        });
        if (res.ok) {
          setSaved(true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle save property status:", err);
    }
  };

  const handleExpressInterest = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please sign in to express interest in this property.");
      navigate("/login");
      return;
    }

    const primaryAgent = property.agents?.find((a: any) => a.primaryAgent)?.subagent || property.agents?.[0]?.subagent;

    setInterestSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: property.id,
          subagentId: primaryAgent?.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        navigate(`/customer/chat/${data.lead.id}`);
      } else {
        alert(data.error || "Failed to start chat with agent.");
      }
    } catch (err) {
      console.error("Error submitting interest:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setInterestSubmitting(false);
    }
  };

  const handleScheduleVisit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please sign in to schedule a visit.");
      navigate("/login");
      return;
    }

    if (!visitDate || !visitTime) {
      alert("Please select date and time for the visit.");
      return;
    }

    const scheduledAt = new Date(`${visitDate}T${visitTime}`);
    setVisitSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: property.id,
          scheduledAt: scheduledAt.toISOString(),
          notes: visitNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Visit scheduled successfully!");
        setShowVisitDialog(false);
        setVisitDate("");
        setVisitTime("");
        setVisitNotes("");
      } else {
        alert(data.error || "Failed to schedule visit.");
      }
    } catch (err) {
      console.error("Error scheduling visit:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setVisitSubmitting(false);
    }
  };

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
        <Link to="/customer/search">
          <Button>Back to Search</Button>
        </Link>
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

  const primaryAgentRelation = property.agents?.find((a: any) => a.primaryAgent) || property.agents?.[0];
  const agent = primaryAgentRelation?.subagent;
  const agentName = agent?.name || "Raj Patel";
  const agentInitials = agentName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

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
        <div className="max-w-7xl mx-auto">
          <div className="relative h-64 sm:h-[400px] lg:h-[500px]">
            <img
              src={images[currentImage]}
              alt={property.title}
              className="size-full object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleToggleSave}
                className="size-10 bg-card rounded-full flex items-center justify-center shadow-elevated hover:scale-105 transition-transform"
              >
                <Heart className={`size-5 ${saved ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
              </button>
              <button className="size-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Share2 className="size-5 text-foreground" />
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
          <div className="grid grid-cols-4 gap-2 p-2">
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="size-5 mr-2" />
                    {propertyLocation}
                  </div>
                </div>
                <div className="text-right">
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

            {/* AI Recommendation */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
              <div className="flex items-start space-x-3">
                <div className="size-10 bg-gradient-brand rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">AI Match Score</h3>
                    <Badge variant="ai">95% Match</Badge>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Why this property suits you:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle2 className="size-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Matches your preference for modern architecture with open floor plans
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="size-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Located in a family-friendly neighborhood with top-rated schools nearby
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="size-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Within your budget range of ₹80L – ₹1.2Cr
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="size-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Features smart home technology aligned with your preferences
                      </span>
                    </li>
                  </ul>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <h3 className="font-semibold text-foreground mb-4">Interested in this property?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Express your interest and our AI will connect you with a verified agent
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleExpressInterest}
                  disabled={interestSubmitting}
                >
                  <MessageSquare className="size-4 mr-2" />
                  {interestSubmitting ? "Opening Chat..." : "Chat with Agent"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowVisitDialog(true)}>
                  <Calendar className="size-4 mr-2" />
                  Schedule Visit
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleToggleSave}>
                  <Heart className={`size-4 mr-2 ${saved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  {saved ? "Saved" : "Save Property"}
                </Button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Sparkles className="size-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Your contact information will remain private. All communications are monitored by our platform for your safety.
                  </p>
                </div>
              </div>
            </Card>

            {showVisitDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">Schedule a Visit</h3>
                    <button onClick={() => setShowVisitDialog(false)} className="text-muted-foreground hover:text-muted-foreground">
                      <X className="size-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Time</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Notes (Optional)</label>
                      <textarea
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowVisitDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleScheduleVisit}
                        disabled={visitSubmitting}
                      >
                        {visitSubmitting ? "Scheduling..." : "Schedule"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Info */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {agentInitials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{agentName}</p>
                  <p className="text-sm text-muted-foreground">Verified Agent</p>
                </div>
              </div>
              <div className="mb-3">
                <Badge variant="success" size="sm">
                <CheckCircle2 className="size-3 mr-1" />
                Platform Verified
              </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                This agent is verified and monitored by our platform for quality and transparency.
              </p>
            </Card>

            {/* Similar Properties */}
            <Card>
              <h3 className="font-semibold text-foreground mb-3">Similar Properties</h3>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex space-x-3 p-2 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors">
                    <img
                      src={`https://images.unsplash.com/photo-160060${i}685154340-be6161a56a0c?w=200`}
                      alt=""
                      className="size-20 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground text-sm">Modern Home</p>
                      <p className="text-xs text-muted-foreground">San Francisco, CA</p>
                      <p className="text-sm font-semibold text-foreground mt-1">₹78,00,000</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
