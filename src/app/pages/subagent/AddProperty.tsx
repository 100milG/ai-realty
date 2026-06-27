import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Upload, MapPin, IndianRupee, CheckCircle2, X } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";

const steps = ["Basic Info", "Details", "Amenities", "Images", "Review"];

export function AddProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    propertyType: "VILLA",
    listingType: "SALE",
    price: "",
    address: "",
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    latitude: "",
    longitude: "",
    localityName: "",
    localityCity: "",
    localityState: "",
    localityCountry: "",
    description: "",
    amenityIds: [] as string[],
  });

  useEffect(() => {
    async function loadConfigData() {
      try {
        const amRes = await fetch(`${import.meta.env.VITE_API_URL}/properties/amenities/all`);
        if (amRes.ok) {
          const amData = await amRes.json();
          setAmenitiesList(amData);
        }
      } catch (err) {
        console.error("Error loading amenities:", err);
      }
    }
    loadConfigData();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      async function loadPropertyToEdit() {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              title: data.title || "",
              propertyType: data.propertyType || "VILLA",
              listingType: data.listingType || "SALE",
              price: data.price ? data.price.toString() : "",
              address: data.address || "",
              beds: data.beds ? data.beds.toString() : "",
              baths: data.baths ? data.baths.toString() : "",
              sqft: data.sqft ? data.sqft.toString() : "",
              yearBuilt: data.yearBuilt ? data.yearBuilt.toString() : "",
              latitude: data.latitude ? data.latitude.toString() : "",
              longitude: data.longitude ? data.longitude.toString() : "",
              localityName: data.locality?.name || "",
              localityCity: data.locality?.city || "",
              localityState: data.locality?.state || "",
              localityCountry: data.locality?.country || "",
              description: data.description || "",
              amenityIds: data.amenities?.map((a: any) => a.amenityId) || []
            });
            setImages(data.media?.map((m: any) => m.url) || []);
          }
        } catch (err) {
          console.error("Error loading property for edit:", err);
        }
      }
      loadPropertyToEdit();
    }
  }, [isEdit, id]);

  const handleImageUpload = () => {
    const mockImages = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    ];
    setImages([...images, ...mockImages]);
  };

  const handleAddressChange = async (val: string) => {
    setFormData(prev => ({ ...prev, address: val }));
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

  const handleSelectSuggestion = (feature: any) => {
    const props = feature.properties || {};
    const formatted = props.formatted || "";
    const lat = props.lat;
    const lon = props.lon;

    const localityName = props.suburb || props.neighbourhood || props.county || props.city || "Unknown Locality";
    const localityCity = props.city || props.county || "Unknown City";
    const localityState = props.state || "";
    const localityCountry = props.country || "";

    setFormData(prev => ({
      ...prev,
      address: formatted,
      latitude: lat ? lat.toString() : "",
      longitude: lon ? lon.toString() : "",
      localityName,
      localityCity,
      localityState,
      localityCountry
    }));

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.address || !formData.propertyType || !formData.listingType) {
      alert("Please fill in all required basic fields, including address.");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price.replace(/,/g, "")),
      address: formData.address,
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      mediaUrls: images.length > 0 ? images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
      amenityIds: formData.amenityIds,
      beds: formData.beds ? parseInt(formData.beds) : null,
      baths: formData.baths ? parseInt(formData.baths) : null,
      sqft: formData.sqft ? parseFloat(formData.sqft) : null,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      localityName: formData.localityName,
      localityCity: formData.localityCity,
      localityState: formData.localityState,
      localityCountry: formData.localityCountry
    };

    try {
      const token = localStorage.getItem("token");
      const url = isEdit ? `${import.meta.env.VITE_API_URL}/properties/${id}` : `${import.meta.env.VITE_API_URL}/properties`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert(isEdit ? "Property updated successfully!" : "Property listing created successfully and sent for approval!");
        navigate("/subagent/properties");
      } else {
        alert(data.error || "Failed to submit property.");
      }
    } catch (err) {
      console.error("Error submitting property:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData({
      ...formData,
      amenityIds: formData.amenityIds.includes(amenityId)
        ? formData.amenityIds.filter((a) => a !== amenityId)
        : [...formData.amenityIds, amenityId],
    });
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.title || !formData.propertyType || !formData.listingType || !formData.price || !formData.address) {
        alert("Please fill in all mandatory fields (Title, Type, Listing Type, Price, Address) before proceeding.");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Edit Property" : "Add New Property"}
          </h1>
          <p className="text-gray-600 mt-1">Fill in the details to list your property</p>
        </div>

        {/* Progress Steps */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`size-10 rounded-full flex items-center justify-center font-semibold transition-colors ${index <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {index < currentStep ? <CheckCircle2 className="size-6" /> : index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${index <= currentStep ? "text-gray-900" : "text-gray-500"
                    }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded ${index < currentStep ? "bg-primary" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Progress Steps (Mobile) */}
        <div className="md:hidden bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <Card>
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern Family Home"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="VILLA">Villa / House</option>
                    <option value="APARTMENT">Apartment / Condo</option>
                    <option value="PLOT">Plot</option>
                    <option value="OFFICE">Office</option>
                    <option value="SHOP">Shop</option>
                    <option value="COMMERCIAL">Commercial Building</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Type *
                  </label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="850000"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="e.g. 123 Dolores St"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
                      autoComplete="off"
                    />
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                      {suggestions.map((item: any, i: number) => {
                        const formatted = item.properties?.formatted || "";
                        return (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(item)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {formatted}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {formData.latitude && formData.longitude && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        📍 Location Captured: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.beds}
                    onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                    placeholder="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.baths}
                    onChange={(e) => setFormData({ ...formData, baths: e.target.value })}
                    placeholder="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Square Feet
                  </label>
                  <input
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                    placeholder="2500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    placeholder="2020"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Describe the property features, location benefits, and unique selling points..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Amenities */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
              {amenitiesList.length === 0 ? (
                <p className="text-gray-500">No amenities config available in database.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${formData.amenityIds.includes(amenity.id)
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        {amenity.name}
                        {formData.amenityIds.includes(amenity.id) && (
                          <CheckCircle2 className="size-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Images */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Property Images</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 size-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-5 text-gray-700" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleImageUpload}
                  className="h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <Upload className="size-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Upload Images</span>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Upload high-quality images of your property. First image will be used as the cover.
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Property Title</p>
                    <p className="font-medium text-gray-900">{formData.title || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium text-gray-900">${formData.price || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Locality</p>
                    <p className="font-medium text-gray-900">
                      {formData.localityName ? `${formData.localityName}${formData.localityCity ? `, ${formData.localityCity}` : ""}` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium text-gray-900 capitalize">{formData.propertyType.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bedrooms / Bathrooms</p>
                    <p className="font-medium text-gray-900">{formData.beds || 0} Beds / {formData.baths || 0} Baths</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area & Year Built</p>
                    <p className="font-medium text-gray-900">{formData.sqft || 0} sqft / Built in {formData.yearBuilt || "N/A"}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Selected Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenityIds.map((id) => {
                      const amenity = amenitiesList.find(a => a.id === id);
                      return amenity ? (
                        <Badge key={id} variant="info" size="sm">{amenity.name}</Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Images</p>
                  <p className="font-medium text-gray-900">{images.length} images uploaded</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Your property will be submitted for admin approval. You'll be notified once it's reviewed.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="success">
              Submit for Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
