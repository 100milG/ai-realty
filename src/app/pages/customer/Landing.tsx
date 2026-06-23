import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Sparkles, Shield, TrendingUp, MessageSquare, Heart, Star } from "lucide-react";
import { Button } from "../../components/Button";
import { PropertyCard } from "../../components/PropertyCard";

const featuredProperties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    price: "$850,000",
    title: "Modern Family Home",
    location: "San Francisco, CA",
    beds: 4,
    baths: 3,
    sqft: 2500,
    aiScore: 95,
    aiReason: "Matches your preference for modern architecture and family-friendly neighborhoods"
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    price: "$1,200,000",
    title: "Luxury Penthouse",
    location: "Los Angeles, CA",
    beds: 3,
    baths: 2,
    sqft: 1800,
    aiScore: 88,
    aiReason: "City views and proximity to downtown match your lifestyle"
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    price: "$650,000",
    title: "Suburban Retreat",
    location: "Austin, TX",
    beds: 3,
    baths: 2,
    sqft: 2200,
    aiScore: 82,
    aiReason: "Quiet neighborhood with excellent schools nearby"
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Home Buyer",
    content: "The AI assistant understood exactly what I was looking for. Found my dream home in just 2 weeks!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "First-time Buyer",
    content: "The platform made the entire process transparent and easy. Love the AI recommendations!",
    rating: 5
  },
];

export function CustomerLanding() {
  const token = localStorage.getItem("token");
  const searchPath = token ? "/customer/search" : "/search";
  const aiChatPath = token ? "/customer/ai-chat" : "/ai-chat";

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching featured properties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const displayProperties = properties.length > 0 ? properties.map(p => ({
    id: p.id,
    image: p.media && p.media[0] ? p.media[0].url : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    price: p.price ? `$${p.price.toLocaleString()}` : "Contact Agent",
    title: p.title,
    location: p.address || (p.locality ? `${p.locality.name}, ${p.locality.city}` : "Unknown Locality"),
    beds: p.beds || 0,
    baths: p.baths || 0,
    sqft: p.sqft || 0,
    aiScore: p.beds && p.beds >= 3 ? 92 : 85,
    aiReason: p.description ? (p.description.length > 100 ? p.description.slice(0, 100) + "..." : p.description) : "Premium residential structure with customized features."
  })) : featuredProperties;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
              <Sparkles className="size-5 text-primary" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Real Estate Platform</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect Home with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              Our AI assistant learns your preferences and matches you with properties that truly fit your lifestyle.
              Trusted, transparent, and intelligent real estate brokerage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={aiChatPath}>
                <Button size="lg" className="w-full sm:w-auto">
                  <Sparkles className="size-5 mr-2" />
                  Start AI Search
                </Button>
              </Link>
              <Link to={searchPath}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Search className="size-5 mr-2" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>

          {/* AI Search Bar */}
          <div className="max-w-2xl mx-auto mt-12 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-2 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center flex-1">
                  <Sparkles className="size-5 text-primary ml-2 sm:ml-4 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Tell our AI what you're looking for... (e.g., 3-bed home near good schools)"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-transparent outline-none text-sm sm:text-base w-full"
                  />
                </div>
                <Button size="lg" className="w-full sm:w-auto">Search</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="size-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our AI learns your preferences and recommends properties that match your unique needs
              </p>
            </div>
            <div className="text-center">
              <div className="size-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="size-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Agents</h3>
              <p className="text-gray-600">
                All communications are monitored and verified for your safety and transparency
              </p>
            </div>
            <div className="text-center">
              <div className="size-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="size-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Get insights on property values, neighborhood trends, and investment potential
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-600 mt-2">Handpicked homes selected by our AI</p>
            </div>
            <Link to={searchPath}>
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              displayProperties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageSquare className="size-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chat with Our AI Assistant
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get personalized recommendations, ask questions, and discover properties that match your exact needs
          </p>
          <Link to={aiChatPath}>
            <Button size="lg" variant="secondary">
              <Sparkles className="size-5 mr-2" />
              Start Conversation
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">{testimonial.content}</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2026 AI Realty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
