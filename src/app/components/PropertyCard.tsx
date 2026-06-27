import { Link, useLocation } from "react-router";
import { MapPin, Bed, Bath, Maximize, Sparkles, ArrowUpRight } from "lucide-react";
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
      <article className="bg-card rounded-xl border border-border overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5">
        <div className="relative h-52 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {aiScore && (
            <div className="absolute top-3 right-3">
              <Badge variant="ai" size="sm">
                <Sparkles className="size-3 mr-1" />
                {aiScore}% Match
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 right-3 size-8 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="size-4 text-foreground" />
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xl font-semibold text-foreground font-numeric">{price}</span>
          </div>
          <h3 className="font-medium text-foreground mb-1.5 line-clamp-1">{title}</h3>
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
            <div className="mt-3 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground line-clamp-2">{aiReason}</p>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
