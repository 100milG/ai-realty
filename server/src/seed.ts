import { PrismaClient, Role, PropertyStatus, PropertyType, ListingType, LeadStatus, MessageSenderType, KYCStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const KNOWN_LOCALITIES = [
  'Andheri', 'Bandra', 'Juhu', 'Versova', 'Santacruz', 'Khar', 'Vile Parle',
  'Goregaon', 'Malad', 'Kandivali', 'Borivali', 'Dahisar',
  'Kurla', 'Ghatkopar', 'Vikhroli', 'Powai', 'Chembur', 'Govandi', 'Mulund',
  'Bhandup', 'Nahur', 'Kanjurmarg', 'Dadar', 'Parel', 'Worli', 'Lower Parel',
  'Matunga', 'Sion', 'Wadala', 'Mahim', 'Dharavi', 'Chunabhatti', 'Colaba',
  'Cuffe Parade', 'Nariman Point', 'Fort', 'Marine Lines', 'Malabar Hill',
  'Walkeshwar', 'Breach Candy', 'Kemp\'s Corner', 'Thane', 'Navi Mumbai',
  'Vashi', 'Kharghar', 'Panvel', 'Nerul', 'Belapur', 'Airoli', 'Ghansoli',
  'Turbhe', 'Rabale', 'Kopar Khairane', 'Mira Road', 'Bhayander', 'Vasai',
  'Nalasopara', 'Virar', 'Vasai Road', 'Dombivli', 'Kalyan', 'Ambernath',
  'Badlapur'
];

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  'flat': PropertyType.APARTMENT,
  'apartment': PropertyType.APARTMENT,
  'penthouse': PropertyType.APARTMENT,
  'house': PropertyType.VILLA,
  'villa': PropertyType.VILLA,
  'bungalow': PropertyType.VILLA,
  'independent house': PropertyType.VILLA,
  'plot': PropertyType.PLOT,
  'land': PropertyType.PLOT,
  'office': PropertyType.OFFICE,
  'shop': PropertyType.SHOP,
  'commercial': PropertyType.COMMERCIAL,
};

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"
];

/**
 * Character-by-character CSV Parser to support multi-line quoted descriptions safely.
 */
function parseCSV(content: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      i++;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') {
        records.push(row);
      }
      row = [];
      cell = '';
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
    } else {
      cell += char;
      i++;
    }
  }
  
  if (row.length > 0 || cell !== '') {
    row.push(cell.trim());
    records.push(row);
  }
  
  return records;
}

function resolveLocality(address: string): string {
  const addrLower = address.toLowerCase();
  for (const loc of KNOWN_LOCALITIES) {
    if (addrLower.includes(loc.toLowerCase())) {
      return loc;
    }
  }
  const parts = address.split(',');
  if (parts.length > 0 && parts[0]?.trim()) {
    return parts[0].trim();
  }
  return 'Mumbai';
}

async function main() {
  console.log("Start seeding production database...");

  // Clean existing data in reverse order of dependencies
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.kYCVerification.deleteMany();
  await prisma.propertyRecommendation.deleteMany();
  await prisma.customerPreference.deleteMany();
  await prisma.aIReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.visitSchedule.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.propertyAgent.deleteMany();
  await prisma.property.deleteMany();
  await prisma.locality.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleaned.");

  // Create hashed password for mock users
  const passwordHash = await bcrypt.hash("password123", 10);
  const priyaPasswordHash = await bcrypt.hash("Priya_RealtySafe_9971", 10);
  const staffPasswordHash = await bcrypt.hash("AgentAdmin_SecurePass_2026", 10);

  // 1. Create Base Users
  const customer = await prisma.user.create({
    data: {
      email: "priya@example.com",
      name: "Priya Sharma",
      phone: "+919876543210",
      passwordHash: priyaPasswordHash,
      role: Role.CUSTOMER,
      emailVerified: true
    }
  });

  const primarySubagent = await prisma.user.create({
    data: {
      email: "raj@example.com",
      name: "Raj Patel",
      phone: "+919876509876",
      passwordHash: staffPasswordHash,
      role: Role.SUBAGENT,
      emailVerified: true
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "System Admin",
      phone: "+919876543211",
      passwordHash: staffPasswordHash,
      role: Role.ADMIN,
      emailVerified: true
    }
  });

  const agentTesting = await prisma.user.create({
    data: {
      email: "agent_testing@example.com",
      name: "Amit Kumar",
      phone: "+919876543212",
      passwordHash: staffPasswordHash,
      role: Role.SUBAGENT,
      emailVerified: true
    }
  });

  console.log("Created base users.");

  // Create KYC Verification for Subagents
  await prisma.kYCVerification.createMany({
    data: [
      {
        userId: primarySubagent.id,
        documents: { license_number: "DL-9988221", verified_country: "IN" },
        status: KYCStatus.APPROVED
      },
      {
        userId: agentTesting.id,
        documents: { license_number: "DL-1234567", verified_country: "IN" },
        status: KYCStatus.PENDING
      }
    ]
  });

  // 2. Parse CSV file
  const csvPath = "D:\\immo\\ai-chatbot\\data\\mumbai.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading and parsing CSV file from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const records = parseCSV(fileContent);

  // Remove header
  const headers = records.shift();
  console.log(`Parsed ${records.length} records from CSV.`);

  // Filter and map valid properties
  const validPropertiesData: any[] = [];
  const uniqueLocalities = new Set<string>();

  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx]!;
    // Row layout must contain at least Price, Address, area
    if (row.length < 3) continue;

    const price = parseFloat(row[0] || '0');
    const address = row[1] || '';
    const area = parseFloat(row[2] || '0');
    
    if (price === 0 || !address || area === 0) continue;

    const lat = row[3] ? parseFloat(row[3]) : null;
    const lng = row[4] ? parseFloat(row[4]) : null;
    const beds = row[5] ? Math.round(parseFloat(row[5])) : null;
    const baths = row[6] ? Math.round(parseFloat(row[6])) : null;
    const balcony = row[7] ? Math.round(parseFloat(row[7])) : null;
    const csvStatus = row[8] || '';
    const neworold = row[9] || '';
    const parking = row[10] ? Math.round(parseFloat(row[10])) : null;
    
    let furnishedStatus = null;
    const fStatus = (row[11] || '').toLowerCase();
    if (fStatus.includes('fully') || fStatus === 'furnished') furnishedStatus = 'FURNISHED';
    else if (fStatus.includes('semi')) furnishedStatus = 'SEMI_FURNISHED';
    else if (fStatus.includes('un')) furnishedStatus = 'UNFURNISHED';

    const buildingType = (row[14] || '').toLowerCase();
    let propertyType: PropertyType = PropertyType.APARTMENT;
    for (const [key, type] of Object.entries(PROPERTY_TYPE_MAP)) {
      if (buildingType.includes(key)) {
        propertyType = type;
        break;
      }
    }

    const description = row[15] || '';
    const priceSqft = row[16] ? parseFloat(row[16]) : null;

    const locName = resolveLocality(address);
    uniqueLocalities.add(locName);

    validPropertiesData.push({
      id: randomUUID(),
      title: `${beds ? beds + ' BHK ' : ''}${propertyType.charAt(0) + propertyType.slice(1).toLowerCase()} in ${locName}`,
      description,
      price,
      address,
      latitude: lat,
      longitude: lng,
      localityName: locName,
      status: csvStatus.toLowerCase().includes('under construction') ? PropertyStatus.PENDING_APPROVAL : PropertyStatus.ACTIVE,
      propertyType,
      listingType: price < 500000 ? ListingType.RENT : ListingType.SALE,
      isVerified: idx % 10 === 0, // Mark 10% properties as verified
      beds,
      baths,
      sqft: area,
      balcony,
      parking,
      furnishedStatus,
      isResale: neworold.toLowerCase().includes('resale'),
      priceSqft,
    });
  }

  console.log(`Verified ${validPropertiesData.length} valid property records.`);

  // 3. Create Localities in Database
  console.log(`Seeding ${uniqueLocalities.size} unique localities...`);
  const localityCache = new Map<string, string>();
  
  for (const locName of Array.from(uniqueLocalities)) {
    const loc = await prisma.locality.create({
      data: {
        name: locName,
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        poi: {
          schools: ["Neighborhood Academy"],
          parks: ["Jogger's Park"],
          transport: ["Local Railway Station"]
        },
        intelligence: {
          market_sentiment: "Stable",
          price_trend: "Increasing",
          average_price_sqft: 18000
        }
      }
    });
    localityCache.set(locName, loc.id);
  }

  // 4. Generate Subagents dynamically
  // Each subagent should have between 5 and 50 properties.
  // We'll target an average of 25 properties per agent.
  const targetAvgProps = 25;
  const numSubagents = Math.max(5, Math.floor(validPropertiesData.length / targetAvgProps));
  console.log(`Generating ${numSubagents} subagents to maintain constraints (5-50 properties per agent)...`);

  const dynamicAgentsData: any[] = [];
  for (let i = 1; i <= (numSubagents - 2); i++) {
    dynamicAgentsData.push({
      id: randomUUID(),
      email: `subagent.${i}@example.com`,
      name: `Subagent ${i}`,
      phone: `+9198765${String(i).padStart(5, '0')}`,
      passwordHash,
      role: Role.SUBAGENT,
      emailVerified: true
    });
  }

  // Bulk create subagents
  await prisma.user.createMany({ data: dynamicAgentsData });

  // Compile full pool of subagent IDs (including Raj and Amit)
  const allSubagents = await prisma.user.findMany({
    where: { role: Role.SUBAGENT },
    select: { id: true, email: true }
  });
  const subagentIds = allSubagents.map(a => a.id);
  console.log(`Total active subagent pool size: ${subagentIds.length}`);

  // 5. Build Property & PropertyAgent & PropertyMedia payload arrays
  const propertiesPayload: any[] = [];
  const propertyAgentsPayload: any[] = [];
  const propertyMediaPayload: any[] = [];

  validPropertiesData.forEach((prop, index) => {
    const localityId = localityCache.get(prop.localityName) || null;
    
    // Round-robin distribution guarantees count is uniform and satisfies 5 <= count <= 50
    const subagentId = subagentIds[index % subagentIds.length]!;

    propertiesPayload.push({
      id: prop.id,
      title: prop.title,
      description: prop.description,
      price: prop.price,
      address: prop.address,
      latitude: prop.latitude,
      longitude: prop.longitude,
      localityId,
      status: prop.status,
      propertyType: prop.propertyType,
      listingType: prop.listingType,
      isVerified: prop.isVerified,
      beds: prop.beds,
      baths: prop.baths,
      sqft: prop.sqft,
      balcony: prop.balcony,
      parking: prop.parking,
      furnishedStatus: prop.furnishedStatus,
      isResale: prop.isResale,
      priceSqft: prop.priceSqft,
    });

    propertyAgentsPayload.push({
      id: randomUUID(),
      propertyId: prop.id,
      subagentId,
      primaryAgent: true,
      commissionPercentage: 2.0
    });

    propertyMediaPayload.push({
      id: randomUUID(),
      propertyId: prop.id,
      fileName: "property_view.jpg",
      fileType: "image/jpeg",
      url: UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length]!,
      size: 102400
    });
  });

  // 6. Write Properties, Agents, and Media in chunks to database
  const CHUNK_SIZE = 5000;
  
  console.log("Writing properties to database in batches...");
  for (let i = 0; i < propertiesPayload.length; i += CHUNK_SIZE) {
    const chunk = propertiesPayload.slice(i, i + CHUNK_SIZE);
    await prisma.property.createMany({ data: chunk });
    console.log(`Inserted properties chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items).`);
  }

  console.log("Writing property agents associations in batches...");
  for (let i = 0; i < propertyAgentsPayload.length; i += CHUNK_SIZE) {
    const chunk = propertyAgentsPayload.slice(i, i + CHUNK_SIZE);
    await prisma.propertyAgent.createMany({ data: chunk });
    console.log(`Inserted property agents chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items).`);
  }

  console.log("Writing property media files in batches...");
  for (let i = 0; i < propertyMediaPayload.length; i += CHUNK_SIZE) {
    const chunk = propertyMediaPayload.slice(i, i + CHUNK_SIZE);
    await prisma.propertyMedia.createMany({ data: chunk });
    console.log(`Inserted property media chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items).`);
  }

  // 7. Seeding Amenities
  console.log("Seeding amenities...");
  const pool = await prisma.amenity.create({ data: { name: "Swimming Pool", description: "Outdoor luxury swimming pool" } });
  const gym = await prisma.amenity.create({ data: { name: "Fitness Center", description: "Fully equipped gym" } });
  const park = await prisma.amenity.create({ data: { name: "Garage Parking", description: "Indoor secure parking garage" } });

  // Map amenities to some properties (e.g. if properties have parking or pool keyword)
  const propertyAmenitiesPayload: any[] = [];
  propertiesPayload.slice(0, 1000).forEach(prop => {
    if (prop.parking && prop.parking > 0) {
      propertyAmenitiesPayload.push({
        id: randomUUID(),
        propertyId: prop.id,
        amenityId: park.id
      });
    }
    if (prop.description?.toLowerCase().includes('pool')) {
      propertyAmenitiesPayload.push({
        id: randomUUID(),
        propertyId: prop.id,
        amenityId: pool.id
      });
    }
    if (prop.description?.toLowerCase().includes('gym')) {
      propertyAmenitiesPayload.push({
        id: randomUUID(),
        propertyId: prop.id,
        amenityId: gym.id
      });
    }
  });

  if (propertyAmenitiesPayload.length > 0) {
    console.log(`Inserting ${propertyAmenitiesPayload.length} property amenities mappings...`);
    await prisma.propertyAmenity.createMany({ data: propertyAmenitiesPayload });
  }

  // 8. Seeding Customer Preferences & AI Recommendations mapping
  console.log("Setting up default preferences and AI recommendations...");
  await prisma.customerPreference.create({
    data: {
      userId: customer.id,
      preferences: {
        budget: 25000000,
        beds: 3,
        features: ["Modern Architecture", "Powai"]
      }
    }
  });

  const recommendationCandidates = propertiesPayload.slice(0, 2);
  if (recommendationCandidates.length >= 2) {
    await prisma.propertyRecommendation.createMany({
      data: [
        {
          userId: customer.id,
          propertyId: recommendationCandidates[0].id,
          score: 0.95,
          explanation: "Matches your preferred bedrooms and locality specifications."
        },
        {
          userId: customer.id,
          propertyId: recommendationCandidates[1].id,
          score: 0.88,
          explanation: "Matches your budget limits and has a Semifurnished structure."
        }
      ]
    });
  }

  // 9. Seeding a mock Lead
  if (propertiesPayload.length > 0) {
    await prisma.lead.create({
      data: {
        customerId: customer.id,
        propertyId: propertiesPayload[0].id,
        subagentId: primarySubagent.id,
        status: LeadStatus.CONTACTED,
        isUnlocked: true,
        notes: "Customer is highly interested in properties in Mumbai."
      }
    });
  }

  console.log("Database seeding completed successfully!");

  // Verify Agent Assignment Constraints
  console.log("\n==========================================");
  console.log("   AGENT ASSIGNMENT CONSTRAINT CHECKS   ");
  console.log("==========================================");
  
  const counts = await prisma.propertyAgent.groupBy({
    by: ['subagentId'],
    _count: {
      propertyId: true
    }
  });

  let allConforms = true;
  for (const c of counts) {
    const agentEmail = allSubagents.find(a => a.id === c.subagentId)?.email || 'Unknown';
    const count = c._count.propertyId;
    if (count < 5 || count > 50) {
      allConforms = false;
      console.error(`❌ Agent ${agentEmail} has ${count} properties (Violates 5-50 constraint)`);
    } else {
      console.log(`✅ Agent ${agentEmail} has ${count} properties`);
    }
  }

  if (allConforms) {
    console.log(`\n🎉 Success! All ${counts.length} subagents have property counts conforming to the [5, 50] constraint!`);
  } else {
    console.warn(`\n⚠️ Attention: Some subagent property distributions do not conform to constraints.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
