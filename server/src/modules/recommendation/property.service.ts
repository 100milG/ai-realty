// ─────────────────────────────────────────────────────────────────────────────
// Module 3 — Property Service (Database Query Layer)
// ─────────────────────────────────────────────────────────────────────────────

import { Prisma } from '@prisma/client';
import { prisma } from '../../db';
import { UserPreferences, RawProperty } from './types';

const DEFAULT_POOL_SIZE = 50;   // Fetch up to 50 candidates, score them all
const BUDGET_FLEX = 1.10;       // Allow prices up to 10% over budget

/**
 * Fetch a pool of candidate properties from the database that broadly match
 * the user's preferences. Returns slim RawProperty objects (not full Prisma rows).
 *
 * @param prefs   - The accumulated user preferences
 * @param poolSize - Max number of candidates to fetch (default 50)
 */
export async function fetchCandidates(
  prefs: Partial<UserPreferences>,
  poolSize = DEFAULT_POOL_SIZE,
): Promise<RawProperty[]> {
  // Build WHERE clause dynamically based on what the user specified
  const where: Prisma.PropertyWhereInput = {
    status: 'ACTIVE',
    deletedAt: null,
  };

  // Property type filter
  if (prefs.propertyType) {
    where.propertyType = prefs.propertyType as any;
  }

  // Listing type filter (SALE / RENT)
  if (prefs.listingType) {
    where.listingType = prefs.listingType as any;
  }

  // Bedrooms filter (allow ±1 flexibility)
  if (prefs.bedroomsMin != null) {
    where.beds = {
      gte: Math.max(1, prefs.bedroomsMin - 1),
      lte: prefs.bedroomsMin + 1,
    };
  }

  // Budget filter (allow up to 10% over)
  if (prefs.budgetMax != null) {
    where.price = {
      lte: prefs.budgetMax * BUDGET_FLEX,
    };
  }

  // Locality filter — use OR + contains because DB stores full address strings
  if (prefs.localities && prefs.localities.length > 0) {
    where.locality = {
      OR: prefs.localities.map(loc => ({
        name: { contains: loc, mode: 'insensitive' as const },
      })),
    };
  }

  const rows = await prisma.property.findMany({
    where,
    take: poolSize,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      price: true,
      beds: true,
      baths: true,
      sqft: true,
      address: true,
      propertyType: true,
      listingType: true,
      furnishedStatus: true,
      isResale: true,
      priceSqft: true,
      latitude: true,
      longitude: true,
      locality: {
        select: {
          name: true,
          poi: true,
          intelligence: true,
        },
      },
      media: {
        select: { url: true }
      },
    },
  });

  // Map Prisma rows → RawProperty (flatten the locality relation)
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    price: row.price,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    address: row.address,
    localityName: row.locality?.name ?? null,
    propertyType: row.propertyType,
    listingType: row.listingType,
    furnishedStatus: row.furnishedStatus,
    isResale: row.isResale,
    priceSqft: row.priceSqft,
    latitude: row.latitude,
    longitude: row.longitude,
    localityPoi: row.locality?.poi as any,
    localityIntelligence: row.locality?.intelligence as any,
    media: row.media,
  }));
}
