import { Link, useLocation } from "react-router";
import { MapPin, Bed, Bath, Maximize, Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "./Badge";

interface PropertyCardProps {
  id: string;
  image: string;
  price: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  aiScore?: number;
  aiReason?: string;
}

export function PropertyCard({
  id,
  image,
  price,
  title,
  location,
  beds,
  baths,
  sqft,
  aiScore,
  aiReason,
}: PropertyCardProps) {
  const loc = useLocation();
  const isCustomer = loc.pathname.startsWith("/customer");
  const detailsPath = isCustomer ? `/customer/property/${id}` : `/property/${id}`;

  return (
    <Link to={detailsPath} className="group block">
      <motion.article 
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300"
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
          {aiScore && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="ai" size="sm" className="glass border-none shadow-sm font-medium">
                <Sparkles className="size-3 mr-1" />
                {aiScore}% Match
              </Badge>
            </div>
          )}
          <div className="absolute bottom-4 right-4 size-10 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="size-5 text-white" />
          </div>
          <div className="absolute bottom-4 left-4 right-16">
            <span className="text-2xl font-semibold text-white font-numeric drop-shadow-sm">{price}</span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-medium text-foreground mb-1.5 line-clamp-1 text-lg">{title}</h3>
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <MapPin className="size-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <Bed className="size-3.5" />
              <span className="font-numeric">{beds}</span> Beds
            </div>
            <div className="flex items-center gap-1">
              <Bath className="size-3.5" />
              <span className="font-numeric">{baths}</span> Baths
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="size-3.5" />
              <span className="font-numeric">{sqft.toLocaleString()} sqft</span>
            </div>
          </div>
          {aiReason && (
            <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{aiReason}</p>
            </div>
          )}
        </div>
      </motion.article>
    </Link>
  );
}
