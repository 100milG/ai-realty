import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Search,
  Sparkles,
  Shield,
  TrendingUp,
  MessageSquare,
  Star,
  Building2,
  Globe,
  Users,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "../../components/Button";
import { PropertyCard } from "../../components/PropertyCard";
import { formatPriceCompact } from "../../lib/format";
import {
  fadeInUp,
  fadeInRight,
  staggerContainer,
  scrollReveal,
  scrollStagger,
  scaleIn,
  viewportOnce,
} from "../../lib/motion";

const featuredProperties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    price: "₹7.1 Cr",
    title: "Skyline Residences",
    location: "Bandra West, Mumbai",
    beds: 4,
    baths: 3,
    sqft: 3200,
    aiScore: 95,
    aiReason: "Premium sea-facing apartment with smart home features and concierge services",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    price: "₹1.2 Cr",
    title: "Harbor View Penthouse",
    location: "Marina Bay, Singapore",
    beds: 3,
    baths: 2,
    sqft: 2100,
    aiScore: 88,
    aiReason: "Panoramic city views with walkable access to business districts",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    price: "₹1.8 Cr",
    title: "Green Valley Villa",
    location: "Whitefield, Bengaluru",
    beds: 4,
    baths: 3,
    sqft: 2800,
    aiScore: 82,
    aiReason: "Gated community with international schools and tech park proximity",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Home Buyer · Mumbai",
    content:
      "The AI understood my budget and lifestyle perfectly. I found a home in Bandra within three weeks — something that would've taken months otherwise.",
    rating: 5,
  },
  {
    name: "James Mitchell",
    role: "Investor · Dubai",
    content:
      "Clean interface, verified agents, and data-backed recommendations. This feels like the future of property search — globally.",
    rating: 5,
  },
];

const stats = [
  { label: "Active Listings", value: "12,000+", icon: Building2 },
  { label: "Cities Covered", value: "48", icon: MapPin },
  { label: "Verified Agents", value: "2,400+", icon: Users },
  { label: "Countries", value: "6", icon: Globe },
];

const AI_SEARCH_SUGGESTIONS = [
  "3BHK under ₹1.5 Cr · Whitefield",
  "Sea-facing flat · Bandra West",
  "Villa with pool · North Goa",
  "Penthouse · Marina Bay",
  "Near top schools · Gurgaon",
  "2BHK under ₹80L · Pune",
  "Gated community · Hyderabad",
  "Investment studio · Dubai Marina",
  "Pet-friendly · Koramangala",
  "Ready to move · Noida",
  "Luxury condo · Singapore",
  "Family home · London suburbs",
  "Lake-view retreat · Udaipur",
  "Smart home · Lower Parel",
  "Corner unit · Indiranagar",
];

function pickRandomSuggestions(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function CustomerLanding() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [visibleSuggestions, setVisibleSuggestions] = useState<string[]>([]);

  const token = localStorage.getItem("token");
  const searchPath = token ? "/customer/search" : "/search";
  const aiChatPath = token ? "/customer/ai-chat" : "/login";
  const aiChatState = token 
    ? (aiQuery ? { initialQuery: aiQuery } : undefined) 
    : { redirectAfterLogin: "/customer/ai-chat", initialQuery: aiQuery };

  useEffect(() => {
    const count = 2 + Math.floor(Math.random() * 2);
    setVisibleSuggestions(pickRandomSuggestions(AI_SEARCH_SUGGESTIONS, count));
  }, []);

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

  const displayProperties =
    properties.length > 0
      ? properties.map((p) => ({
          id: p.id,
          image:
            p.media && p.media[0]
              ? p.media[0].url
              : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
          price: p.price ? formatPriceCompact(p.price) : "Price on request",
          title: p.title,
          location:
            p.address ||
            (p.locality ? `${p.locality.name}, ${p.locality.city}` : "Unknown Locality"),
          beds: p.beds || 0,
          baths: p.baths || 0,
          sqft: p.sqft || 0,
          aiScore: p.beds && p.beds >= 3 ? 92 : 85,
          aiReason: p.description
            ? p.description.length > 100
              ? p.description.slice(0, 100) + "..."
              : p.description
            : "Premium residential structure with curated amenities.",
        }))
      : featuredProperties;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-hero">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-24 size-[32rem] bg-primary/15 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"
          />
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-40 -left-32 size-[32rem] bg-accent/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div
              className="lg:pt-2"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1 className="text-foreground mb-6" variants={fadeInUp}>
              <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">Curated for you</p>
                Discover homes that match{" "}
                <span className="text-gradient-brand italic">your life</span>, not just your budget
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed"
                variants={fadeInUp}
              >
                From Mumbai penthouses to Singapore condos — our AI learns what matters to you and
                connects you with verified agents across markets.
              </motion.p>

              <motion.div
                className="glass-heavy rounded-2xl shadow-elevated p-2 border border-white/40 dark:border-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(26,83,92,0.12)] mb-4 group relative overflow-hidden"
                variants={fadeInUp}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none dark:via-white/5" />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center flex-1 px-3">
                    <Sparkles className="size-5 text-primary shrink-0" />
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Describe your ideal home..."
                      className="flex-1 px-3 py-3 bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                    />
                  </div>
                  <Link to={aiChatPath} state={aiChatState}>
                    <Button size="lg" className="w-full sm:w-auto shrink-0 gap-2">
                      <Sparkles className="size-4" />
                      Ask AI
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-2 mb-4 px-0.5"
                variants={fadeInUp}
              >
                {visibleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setAiQuery(suggestion)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                      aiQuery === suggestion
                        ? "glass border-primary bg-primary/10 text-primary font-medium shadow-sm"
                        : "glass border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-white/40 dark:hover:bg-white/5"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Link
                  to={searchPath}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Search className="size-4" />
                  Browse all listings
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              className="relative hidden lg:block lg:pt-2"
              initial="hidden"
              animate="visible"
              variants={fadeInRight}
            >
              <div className="relative w-[65%] ml-auto">
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-elevated aspect-[4/5]"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900"
                    alt="Luxury property"
                    className="size-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 glass p-4 rounded-xl border border-white/20 shadow-lg">
                    <p className="text-white/80 text-xs mb-1 uppercase tracking-wider font-semibold">Featured · Mumbai</p>
                    <p className="text-white text-xl font-display font-semibold mb-2">Skyline Residences</p>
                    <p className="text-primary-foreground text-sm font-medium bg-primary inline-flex px-2.5 py-1 rounded-md shadow-sm">₹7.1 Cr · 100% Match</p>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -bottom-3 -right-3 bg-card rounded-xl border border-border shadow-elevated p-3 flex items-center gap-2.5"
                  initial={{ opacity: 0, y: 16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">AI Score Upto</p>
                    <p className="text-base font-semibold text-foreground font-numeric">95%</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <motion.section
        className="border-y border-border bg-card"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={scrollStagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="flex items-center gap-4"
                  variants={scrollReveal}
                >
                  <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110 duration-300">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground font-numeric">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
          >
            <h2 className="text-foreground mb-4">Proptech intelligence, human expertise</h2>
            <p className="text-muted-foreground text-lg">
              The precision of modern technology with the trust of verified local agents.
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={scrollStagger}
          >
            {[
              {
                icon: Sparkles,
                title: "AI-Powered Matching",
                desc: "Natural language search that understands lifestyle, location, and investment goals across markets.",
                color: "bg-primary/10 text-primary",
              },
              {
                icon: Shield,
                title: "Verified Agents",
                desc: "Every subagent is KYC-verified. All conversations are monitored for transparency and safety.",
                color: "bg-accent/15 text-accent dark:text-accent",
              },
              {
                icon: TrendingUp,
                title: "Market Intelligence",
                desc: "Neighbourhood insights, price trends, and investment potential — data you can act on.",
                color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={scrollReveal}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="group p-8 rounded-2xl border border-border bg-card shadow-soft hover:shadow-elevated transition-shadow duration-300"
                >
                  <div
                    className={`size-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="size-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
          >
            <div>
              <h2 className="text-foreground">Featured Properties</h2>
              <p className="text-muted-foreground mt-2">Handpicked listings across premium markets</p>
            </div>
            <Link to={searchPath}>
              <Button variant="outline" className="gap-2 transition-transform hover:scale-[1.02]">
                View All
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={scrollStagger}
            >
              {displayProperties.map((property) => (
                <motion.div key={property.id} variants={scrollReveal}>
                  <PropertyCard {...property} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <motion.div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn}>
            <MessageSquare className="size-14 text-white/90 mx-auto mb-6" />
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-display text-white mb-4"
            variants={fadeInUp}
          >
            Your personal property advisor, always on
          </motion.h2>
          <motion.p
            className="text-lg text-white/80 mb-8 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Describe your dream home in plain language. Get instant matches, neighbourhood insights,
            and direct access to verified agents.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link to={aiChatPath}>
              <Button size="lg" variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90 transition-transform hover:scale-[1.03] active:scale-[0.98]">
                <Sparkles className="size-5" />
                Start Conversation
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
          >
            <h2 className="text-foreground mb-3">Trusted by buyers worldwide</h2>
            <p className="text-muted-foreground">Real stories from our community</p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={scrollStagger}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scrollReveal}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="bg-card rounded-2xl border border-border p-8 shadow-soft hover:shadow-elevated transition-shadow duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 italic">"{testimonial.content}"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Building2 className="size-4 text-white" />
                </div>
                <span className="font-display text-xl font-semibold">AI Realty</span>
              </div>
              <p className="text-background/70 max-w-sm leading-relaxed">
                Premium property discovery powered by AI. Connecting buyers with verified agents
                across India and global markets.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/50">Explore</h4>
              <ul className="space-y-2 text-background/70 text-sm">
                <li><Link to={searchPath} className="hover:text-background transition-colors">Search Properties</Link></li>
                <li><Link to={aiChatPath} className="hover:text-background transition-colors">AI Assistant</Link></li>
                <li><Link to="/login" className="hover:text-background transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/50">Markets</h4>
              <ul className="space-y-2 text-background/70 text-sm">
                <li>Mumbai · Bengaluru · Delhi NCR</li>
                <li>Dubai · Singapore · London</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8 text-center text-sm text-background/50">
            © 2026 AI Realty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
