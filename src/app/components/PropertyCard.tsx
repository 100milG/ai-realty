import { Link, useLocation } from "react-router";
import { MapPin, Bed, Bath, Maximize, Sparkles } from "lucide-react";
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
  const isCustomer = loc.pathname.startsWith('/customer');
  const detailsPath = isCustomer ? `/customer/property/${id}` : `/property/${id}`;

  return (
    <Link to={detailsPath}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48">
          <img src={image} alt={title} className="size-full object-cover" />
          {aiScore && (
            <div className="absolute top-3 right-3">
              <Badge variant="ai" size="sm">
                <Sparkles className="size-3 mr-1" />
                {aiScore}% Match
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-semibold text-gray-900">{price}</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="size-4 mr-1" />
            {location}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <div className="flex items-center">
              <Bed className="size-4 mr-1" />
              {beds} Beds
            </div>
            <div className="flex items-center">
              <Bath className="size-4 mr-1" />
              {baths} Baths
            </div>
            <div className="flex items-center">
              <Maximize className="size-4 mr-1" />
              {sqft} sqft
            </div>
          </div>
          {aiReason && (
            <div className="mt-3 p-2 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700">{aiReason}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
