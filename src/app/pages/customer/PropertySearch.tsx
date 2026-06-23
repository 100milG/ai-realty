import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MapPin, Sparkles, X } from "lucide-react";
import { PropertyCard } from "../../components/PropertyCard";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";

export function PropertySearch() {
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [bedrooms, setBedrooms] = useState<string>("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("status", "ACTIVE");
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAllProperties(data);
          setFilteredProperties(data);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let result = [...allProperties];

    // Filter by location autocomplete selection or free-text query
    if (selectedLocation) {
      const { lat, lon, city } = selectedLocation;
      result = result.filter((p) => {
        if (p.latitude && p.longitude && lat && lon) {
          const dist = calculateDistance(lat, lon, p.latitude, p.longitude);
          return dist <= 50;
        }
        const propertyCity = p.locality?.city || "";
        const propertyAddress = p.address || "";
        const queryText = (city || selectedLocation.formatted || "").toLowerCase();
        return (
          propertyCity.toLowerCase().includes(queryText) ||
          propertyAddress.toLowerCase().includes(queryText)
        );
      });
    } else if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const title = p.title || "";
        const address = p.address || "";
        const city = p.locality?.city || "";
        const type = p.propertyType || "";
        return (
          title.toLowerCase().includes(query) ||
          address.toLowerCase().includes(query) ||
          city.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query)
        );
      });
    }

    // Filter by Price Range
    if (priceRange !== "all") {
      result = result.filter((p) => {
        if (!p.price) return false;
        if (priceRange === "0-500k") return p.price < 500000;
        if (priceRange === "500k-1m") return p.price >= 500000 && p.price <= 1000000;
        if (priceRange === "1m-2m") return p.price >= 1000000 && p.price <= 2000000;
        if (priceRange === "2m+") return p.price > 2000000;
        return true;
      });
    }

    // Filter by Bedrooms
    if (bedrooms !== "all") {
      result = result.filter((p) => {
        const beds = p.beds || 0;
        if (bedrooms === "4+") return beds >= 4;
        return beds === parseInt(bedrooms);
      });
    }

    setFilteredProperties(result);
  }, [allProperties, selectedLocation, searchQuery, priceRange, bedrooms]);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val) {
      setSelectedLocation(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || "1232248040f54a0282596eb8fab64d12";
      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(val)}&apiKey=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const features = data.features || [];
        setSuggestions(features);
        setShowSuggestions(features.length > 0);
      }
    } catch (err) {
      console.error("Geoapify autocomplete error:", err);
    }
  };

  const handleSelectLocation = (feature: any) => {
    const props = feature.properties || {};
    const formatted = props.formatted || "";
    setSelectedLocation({
      lat: props.lat,
      lon: props.lon,
      city: props.city,
      state: props.state,
      country: props.country,
      formatted: formatted
    });
    setSearchQuery(formatted);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 lg:top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 border border-transparent focus-within:border-gray-200">
                <Search className="size-5 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Search by location, neighborhood, or address..."
                  className="flex-1 bg-transparent outline-none text-sm w-full"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-450 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {suggestions.map((item: any, i: number) => {
                    const formatted = item.properties?.formatted || "";
                    return (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectLocation(item)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {formatted}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex-1 sm:flex-none">
                <SlidersHorizontal className="size-4 mr-2" />
                Filters
              </Button>
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm flex-1 sm:flex-none">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          {/* AI Preferences */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
            <div className="flex items-center text-gray-600 mr-1">
              <Sparkles className="size-4 text-primary mr-1 flex-shrink-0" />
              <span>AI Preferences:</span>
            </div>
            <Badge variant="ai" size="sm">Modern Architecture</Badge>
            <Badge variant="ai" size="sm">Good Schools</Badge>
            <Badge variant="ai" size="sm">3-4 Bedrooms</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Backdrop for Mobile Sidebar */}
          {showFilters && (
            <div
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}

          {/* Filter Sidebar */}
          <aside className={`
            fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl p-6 border-l border-gray-200 transform transition-transform duration-300 ease-in-out overflow-y-auto
            lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:bg-transparent lg:shadow-none lg:p-0 lg:border-none lg:transform-none lg:block
            ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex items-center justify-between lg:hidden mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 text-gray-500 hover:text-gray-900">
                <X className="size-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="all">All Prices</option>
                  <option value="0-500k">Under $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m-2m">$1M - $2M</option>
                  <option value="2m+">$2M+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4+'].map((bed) => (
                    <button
                      key={bed}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        bedrooms === bed
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setBedrooms(bed)}
                    >
                      {bed}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <div className="space-y-2">
                  {['House', 'Apartment', 'Condo', 'Townhouse', 'Villa'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input type="checkbox" className="rounded text-primary mr-2" />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="space-y-2">
                  {['Pool', 'Garage', 'Garden', 'Gym', 'Security'].map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input type="checkbox" className="rounded text-primary mr-2" />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </aside>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm">{filteredProperties.length} properties found</p>
              <Button variant="ghost" size="sm">
                <MapPin className="size-4 mr-2" />
                Map View
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">No active properties found matching your search.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property: any) => {
                  const imageUrl = property.media && property.media[0] ? property.media[0].url : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
                  const formattedPrice = property.price ? `$${property.price.toLocaleString()}` : "Contact Agent";
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
                      aiScore={92} 
                      aiReason="Matches your search preferences."
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-wrap justify-center mt-8 gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">1</Button>
              <Button size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
