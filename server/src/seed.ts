import { PrismaClient, Role, PropertyStatus, PropertyType, ListingType, LeadStatus, MessageSenderType, KYCStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // 1. Create Users
  const customer = await prisma.user.create({
    data: {
      email: "priya@example.com",
      name: "Priya Sharma",
      phone: "+919876543210",
      passwordHash,
      role: Role.CUSTOMER,
      emailVerified: true
    }
  });

  const subagent = await prisma.user.create({
    data: {
      email: "raj@example.com",
      name: "Raj Patel",
      phone: "+919876509876",
      passwordHash,
      role: Role.SUBAGENT,
      emailVerified: true
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "System Admin",
      phone: "+919876543211",
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true
    }
  });

  const agentTesting = await prisma.user.create({
    data: {
      email: "agent_testing@example.com",
      name: "Amit Kumar",
      phone: "+919876543212",
      passwordHash,
      role: Role.SUBAGENT,
      emailVerified: true
    }
  });

  console.log("Created users:", {
    customer: customer.email,
    subagent: subagent.email,
    admin: admin.email,
    agentTesting: agentTesting.email
  });

  // 2. Create KYC Verification for Subagent
  await prisma.kYCVerification.create({
    data: {
      userId: subagent.id,
      documents: {
        license_number: "DL-9988221",
        verified_country: "US"
      },
      status: KYCStatus.APPROVED
    }
  });

  await prisma.kYCVerification.create({
    data: {
      userId: agentTesting.id,
      documents: {
        license_number: "DL-1234567",
        verified_country: "US"
      },
      status: KYCStatus.PENDING
    }
  });

  // 3. Create Localities
  const locality1 = await prisma.locality.create({
    data: {
      name: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      latitude: 19.0617,
      longitude: 72.8369,
      poi: {
        schools: ["Bandra High School", "St. Andrew's High School"],
        parks: ["Carter Road Promenade", "Bandstand"],
        transport: ["Bandra Station"]
      },
      intelligence: {
        market_sentiment: "High Demand",
        price_trend: "Increasing",
        average_price_sqft: 25000
      }
    }
  });

  const locality2 = await prisma.locality.create({
    data: {
      name: "Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      latitude: 19.1136,
      longitude: 72.8697,
      poi: {
        shopping: ["Infiniti Mall", "Oberoi Mall"],
        parks: ["Jogger's Park"]
      },
      intelligence: {
        market_sentiment: "Stable",
        price_trend: "Flat",
        average_price_sqft: 18000
      }
    }
  });

  const locality3 = await prisma.locality.create({
    data: {
      name: "Powai",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      latitude: 19.1197,
      longitude: 72.9059,
      poi: {
        dining: ["Hiranandani Gardens", "Powai Lake"]
      },
      intelligence: {
        market_sentiment: "Expanding",
        price_trend: "Increasing",
        average_price_sqft: 20000
      }
    }
  });

  const locality4 = await prisma.locality.create({
    data: {
      name: "Khar West",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      latitude: 19.0728,
      longitude: 72.8314
    }
  });

  console.log("Created localities.");

  // 4. Create Properties
  const prop1 = await prisma.property.create({
    data: {
      title: "Modern Family Villa in Bandra West",
      description: "Matches your preference for modern architecture and family-friendly neighborhoods. Built in 2020 with smart home integrations and solar panels.",
      price: 25000000.00,
      address: "Carter Road, Bandra West, Mumbai - 400050, Maharashtra",
      latitude: 19.0617,
      longitude: 72.8369,
      localityId: locality1.id,
      status: PropertyStatus.ACTIVE,
      propertyType: PropertyType.VILLA,
      listingType: ListingType.SALE,
      isVerified: true,
      beds: 4,
      baths: 3,
      sqft: 2500,
      yearBuilt: 2020
    }
  });

  const prop2 = await prisma.property.create({
    data: {
      title: "Luxury Penthouse in Andheri West",
      description: "City views and proximity to downtown match your lifestyle. Full-service concierge and rooftop swimming pool access.",
      price: 45000000.00,
      address: "Link Road, Andheri West, Mumbai - 400053, Maharashtra",
      latitude: 19.1136,
      longitude: 72.8697,
      localityId: locality2.id,
      status: PropertyStatus.ACTIVE,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      isVerified: true,
      beds: 3,
      baths: 2,
      sqft: 1800,
      yearBuilt: 2018
    }
  });

  const prop3 = await prisma.property.create({
    data: {
      title: "Premium Apartment in Powai",
      description: "Quiet neighborhood with excellent schools nearby. Huge backyard and beautiful landscaping.",
      price: 18000000.00,
      address: "Hiranandani Gardens, Powai, Mumbai - 400076, Maharashtra",
      latitude: 19.1197,
      longitude: 72.9059,
      localityId: locality3.id,
      status: PropertyStatus.PENDING_APPROVAL,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      isVerified: false,
      beds: 3,
      baths: 2,
      sqft: 1500,
      yearBuilt: 2021
    }
  });

  const propAadsfg = await prisma.property.create({
    data: {
      title: "Cozy 2BHK in Khar West",
      description: "A simple mock property located near Khar Station.",
      price: 15000000.00,
      address: "Khar Station Road, Khar West, Mumbai - 400052, Maharashtra",
      latitude: 19.0728,
      longitude: 72.8314,
      localityId: locality4.id,
      status: PropertyStatus.ACTIVE,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      isVerified: false,
      beds: 2,
      baths: 2,
      sqft: 1000,
      yearBuilt: 2019
    }
  });

  const propTesting = await prisma.property.create({
    data: {
      title: "Brand New 3BHK Villa in Powai",
      description: "Beautiful testing villa with dynamic autocomplete geocoded details.",
      price: 32000000.00,
      address: "Powai Lake Road, Powai, Mumbai - 400076, Maharashtra",
      latitude: 19.1197,
      longitude: 72.9059,
      localityId: locality3.id,
      status: PropertyStatus.PENDING_APPROVAL,
      propertyType: PropertyType.VILLA,
      listingType: ListingType.SALE,
      isVerified: false,
      beds: 3,
      baths: 2,
      sqft: 1850,
      yearBuilt: 2022
    }
  });

  const propSada = await prisma.property.create({
    data: {
      title: "Premium 4BHK in Bandra West",
      description: "Another test property listing.",
      price: 55000000.00,
      address: "Bandstand, Bandra West, Mumbai - 400050, Maharashtra",
      latitude: 19.0617,
      longitude: 72.8369,
      localityId: locality1.id,
      status: PropertyStatus.ACTIVE,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      isVerified: true,
      beds: 4,
      baths: 3,
      sqft: 2200,
      yearBuilt: 2020
    }
  });

  console.log("Created properties.");

  // 5. Map Properties to Subagents
  await prisma.propertyAgent.createMany({
    data: [
      {
        propertyId: prop1.id,
        subagentId: subagent.id,
        primaryAgent: true,
        commissionPercentage: 2.5
      },
      {
        propertyId: prop2.id,
        subagentId: subagent.id,
        primaryAgent: true,
        commissionPercentage: 3.0
      },
      {
        propertyId: prop3.id,
        subagentId: subagent.id,
        primaryAgent: true,
        commissionPercentage: 2.5
      },
      {
        propertyId: propAadsfg.id,
        subagentId: subagent.id,
        primaryAgent: true,
        commissionPercentage: null
      },
      {
        propertyId: propTesting.id,
        subagentId: agentTesting.id,
        primaryAgent: true,
        commissionPercentage: null
      },
      {
        propertyId: propSada.id,
        subagentId: subagent.id,
        primaryAgent: true,
        commissionPercentage: null
      }
    ]
  });

  // 6. Create Property Media
  await prisma.propertyMedia.createMany({
    data: [
      {
        propertyId: prop1.id,
        fileName: "home_exterior.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        size: 204857
      },
      {
        propertyId: prop2.id,
        fileName: "penthouse_interior.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        size: 198421
      },
      {
        propertyId: prop3.id,
        fileName: "suburban_garden.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        size: 345091
      },
      {
        propertyId: propAadsfg.id,
        fileName: "media_1.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        size: 12345
      },
      {
        propertyId: propTesting.id,
        fileName: "media_1.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        size: 12345
      },
      {
        propertyId: propSada.id,
        fileName: "media_1.jpg",
        fileType: "image/jpeg",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        size: 12345
      }
    ]
  });

  // 7. Create Amenities
  const pool = await prisma.amenity.create({ data: { name: "Swimming Pool", description: "Outdoor luxury swimming pool" } });
  const gym = await prisma.amenity.create({ data: { name: "Fitness Center", description: "Fully equipped gym" } });
  const park = await prisma.amenity.create({ data: { name: "Garage Parking", description: "Indoor secure parking garage" } });

  // Map Amenities to Properties
  await prisma.propertyAmenity.createMany({
    data: [
      { propertyId: prop1.id, amenityId: pool.id },
      { propertyId: prop1.id, amenityId: park.id },
      { propertyId: prop2.id, amenityId: pool.id },
      { propertyId: prop2.id, amenityId: gym.id },
      { propertyId: prop3.id, amenityId: park.id }
    ]
  });

  console.log("Created media and amenities.");

  // 8. Create Customer Preferences & AI Recommendations
  await prisma.customerPreference.create({
    data: {
      userId: customer.id,
      preferences: {
        budget: 900000,
        beds: 4,
        features: ["Modern Architecture", "Dolores Park"]
      }
    }
  });

  await prisma.propertyRecommendation.createMany({
    data: [
      {
        userId: customer.id,
        propertyId: prop1.id,
        score: 0.95,
        explanation: "Matches your preference for modern architecture and Dolores Park proximity"
      },
      {
        userId: customer.id,
        propertyId: prop2.id,
        score: 0.88,
        explanation: "Matches your budget and preference for premium layouts"
      }
    ]
  });

  // 9. Create Leads
  const lead1 = await prisma.lead.create({
    data: {
      customerId: customer.id,
      propertyId: prop1.id,
      subagentId: subagent.id,
      status: LeadStatus.CONTACTED,
      isUnlocked: true,
      notes: "Customer is very interested in the kitchen utilities."
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      customerId: customer.id,
      propertyId: prop2.id,
      subagentId: subagent.id,
      status: LeadStatus.NEW,
      isUnlocked: false,
      notes: "Lead requested via AI Search Assistant."
    }
  });

  console.log("Created leads.");

  // 10. Create Chat Sessions and Messages
  const chatSession1 = await prisma.chatSession.create({
    data: {
      subject: "Discussion: Modern Family Home",
      isAI: false
    }
  });

  await prisma.chatParticipant.createMany({
    data: [
      { sessionId: chatSession1.id, userId: customer.id, role: "customer" },
      { sessionId: chatSession1.id, userId: subagent.id, role: "subagent" }
    ]
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: chatSession1.id,
        senderId: subagent.id,
        senderType: MessageSenderType.SUBAGENT,
        content: "Hi Sarah! Thanks for showing interest in the Modern Family Home. Let me know if you have any questions."
      },
      {
        sessionId: chatSession1.id,
        senderId: customer.id,
        senderType: MessageSenderType.USER,
        content: "Hello John, thank you. The listing looks gorgeous! Is the price negotiable at all?"
      },
      {
        sessionId: chatSession1.id,
        senderId: subagent.id,
        senderType: MessageSenderType.SUBAGENT,
        content: "The seller is open to negotiations for buyers who can make an all-cash offer or quick close."
      }
    ]
  });

  console.log("Created chat sessions and messages.");
  console.log("Production schema seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
