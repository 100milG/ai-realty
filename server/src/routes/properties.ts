import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../db";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middlewares/auth";
import { PropertyStatus, PropertyType, ListingType } from "@prisma/client";

const router = Router();

// Configure multer storage for property images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (.jpg, .jpeg, .png, .webp) are allowed!"));
  }
});

/**
 * POST /api/properties/upload
 * Upload an image file (Restricted to SUBAGENT or ADMIN)
 */
router.post("/upload", authenticateToken, authorizeRoles("SUBAGENT", "ADMIN"), upload.single("file"), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const port = process.env.PORT || 5000;
  const baseUrl = process.env.API_URL || `http://localhost:${port}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return res.json({
    url: fileUrl,
    filename: req.file.filename
  });
});

/**
 * GET /api/properties
 * Retrieve all properties (public access) with optional filters
 */
router.get("/", async (req, res) => {
  const { status, type, city } = req.query;

  try {
    // Check if optional token is provided
    let userRole: string | null = null;
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "ai_realty_secret_session_token_key_12345";
        const decoded = jwt.verify(token, secret) as any;
        userRole = decoded.role;
        userId = decoded.id;
      } catch (e) {
        // Ignore token errors for public endpoint
      }
    }

    const filter: any = {
      deletedAt: null
    };

    // Filter by listing status based on role permissions
    if (userRole === "SUBAGENT" && req.query.myListings === "true" && userId) {
      filter.agents = {
        some: {
          subagentId: userId
        }
      };
      if (status && status !== "all") {
        filter.status = status as PropertyStatus;
      }
    } else if (userRole === "ADMIN") {
      if (status && status !== "all") {
        filter.status = status as PropertyStatus;
      }
    } else if (userRole === "SUBAGENT" && userId) {
      const statusFilter = (status && status !== "all") ? (status as PropertyStatus) : undefined;
      filter.OR = [
        {
          status: statusFilter || PropertyStatus.ACTIVE
        },
        {
          agents: {
            some: {
              subagentId: userId
            }
          },
          ...(statusFilter ? { status: statusFilter } : {})
        }
      ];
    } else {
      // Public / Customer access: only see ACTIVE properties
      filter.status = PropertyStatus.ACTIVE;
    }

    // Filter by type (APARTMENT, VILLA, etc.)
    if (type) {
      filter.propertyType = type as PropertyType;
    }

    // Filter by city (using Locality join)
    if (city) {
      filter.locality = {
        city: {
          contains: city as string,
          mode: "insensitive"
        }
      };
    }

    const properties = await prisma.property.findMany({
      where: filter,
      include: {
        locality: true,
        media: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        agents: {
          include: {
            subagent: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(properties);
  } catch (error) {
    console.error("[properties get error]", error);
    return res.status(500).json({ error: "Failed to retrieve properties." });
  }
});

/**
 * GET /api/properties/:id
 * Retrieve details for a single property
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        locality: true,
        media: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        agents: {
          include: {
            subagent: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    return res.json(property);
  } catch (error) {
    console.error("[property get id error]", error);
    return res.status(500).json({ error: "Failed to retrieve property details." });
  }
});

/**
 * POST /api/properties
 * Add a new property (Restricted to SUBAGENT)
 */
router.post("/", authenticateToken, authorizeRoles("SUBAGENT"), async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    price,
    address,
    localityId,
    propertyType,
    listingType,
    mediaUrls,
    amenityIds,
    beds,
    baths,
    sqft,
    yearBuilt,
    latitude,
    longitude,
    localityName,
    localityCity,
    localityState,
    localityCountry
  } = req.body;

  const agentId = req.user!.id;

  if (!title || !price || !propertyType || !listingType) {
    return res.status(400).json({ error: "Title, price, propertyType, and listingType are required fields." });
  }

  try {
    let finalLocalityId = localityId || null;

    if (!finalLocalityId && localityName) {
      // Find or create locality by name and city
      let locality = await prisma.locality.findFirst({
        where: {
          name: localityName,
          city: localityCity || null,
          deletedAt: null
        }
      });

      if (!locality) {
        locality = await prisma.locality.create({
          data: {
            name: localityName,
            city: localityCity || null,
            state: localityState || null,
            country: localityCountry || null,
          }
        });
      }
      finalLocalityId = locality.id;
    }

    // 1. Create the Property
    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        address,
        localityId: finalLocalityId,
        status: PropertyStatus.PENDING_APPROVAL, // Default status for moderation
        propertyType: propertyType as PropertyType,
        listingType: listingType as ListingType,
        isVerified: false,
        beds: beds ? parseInt(beds) : null,
        baths: baths ? parseInt(baths) : null,
        sqft: sqft ? parseFloat(sqft) : null,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        // Map agents (many-to-many) in the same call
        agents: {
          create: {
            subagentId: agentId,
            primaryAgent: true
          }
        },
        // Map media files
        media: mediaUrls ? {
          createMany: {
            data: mediaUrls.map((url: string, index: number) => ({
              fileName: `media_${index + 1}.jpg`,
              fileType: "image/jpeg",
              url
            }))
          }
        } : undefined,
        // Map amenities
        amenities: amenityIds ? {
          createMany: {
            data: amenityIds.map((id: string) => ({
              amenityId: id
            }))
          }
        } : undefined
      }
    });

    return res.status(201).json({
      message: "Property created successfully and sent for approval!",
      property
    });
  } catch (error) {
    console.error("[property create error]", error);
    return res.status(500).json({ error: "Failed to create property." });
  }
});

/**
 * PUT /api/properties/:id/status
 * Moderate a property (Restricted to ADMIN)
 */
router.put("/:id/status", authenticateToken, authorizeRoles("ADMIN"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // e.g. ACTIVE or REJECTED

  if (!status || !Object.values(PropertyStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

    try {
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: {
          status: status as PropertyStatus,
          approvedBy: req.user!.email,
          approvedAt: status === PropertyStatus.ACTIVE ? new Date() : null
        }
      });

    return res.json({
      message: `Property status updated to ${status}!`,
      property: updatedProperty
    });
  } catch (error) {
    console.error("[property moderate error]", error);
    return res.status(500).json({ error: "Failed to moderate property." });
  }
});

/**
 * PUT /api/properties/:id
 * Update an existing property listing (Restricted to owner SUBAGENT or ADMIN)
 */
router.put("/:id", authenticateToken, authorizeRoles("SUBAGENT", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    price,
    address,
    localityId,
    propertyType,
    listingType,
    mediaUrls,
    amenityIds,
    beds,
    baths,
    sqft,
    yearBuilt,
    latitude,
    longitude
  } = req.body;

  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    // 1. Fetch property and its agents to check ownership
    const property = await prisma.property.findUnique({
      where: { id },
      include: { agents: true }
    });

    if (!property || property.deletedAt) {
      return res.status(404).json({ error: "Property not found." });
    }

    // Check ownership
    const isOwner = property.agents.some(a => a.subagentId === userId);
    if (!isOwner && role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized. You are not assigned as an agent for this property." });
    }

    let finalLocalityId = localityId !== undefined ? localityId : undefined;

    if (req.body.localityName !== undefined) {
      if (req.body.localityName) {
        // Find or create locality by name and city
        let locality = await prisma.locality.findFirst({
          where: {
            name: req.body.localityName,
            city: req.body.localityCity || null,
            deletedAt: null
          }
        });

        if (!locality) {
          locality = await prisma.locality.create({
            data: {
              name: req.body.localityName,
              city: req.body.localityCity || null,
              state: req.body.localityState || null,
              country: req.body.localityCountry || null,
            }
          });
        }
        finalLocalityId = locality.id;
      } else {
        finalLocalityId = null;
      }
    }

    // 2. Update basic fields
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title: title !== undefined ? title : property.title,
        description: description !== undefined ? description : property.description,
        price: price !== undefined ? parseFloat(price) : property.price,
        address: address !== undefined ? address : property.address,
        localityId: finalLocalityId !== undefined ? finalLocalityId : property.localityId,
        propertyType: propertyType !== undefined ? propertyType as PropertyType : property.propertyType,
        listingType: listingType !== undefined ? listingType as ListingType : property.listingType,
        status: role === "ADMIN" ? property.status : PropertyStatus.PENDING_APPROVAL, // reset for re-approval unless admin
        beds: beds !== undefined ? (beds ? parseInt(beds) : null) : undefined,
        baths: baths !== undefined ? (baths ? parseInt(baths) : null) : undefined,
        sqft: sqft !== undefined ? (sqft ? parseFloat(sqft) : null) : undefined,
        yearBuilt: yearBuilt !== undefined ? (yearBuilt ? parseInt(yearBuilt) : null) : undefined,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
      }
    });

    // 3. Update media if provided
    if (mediaUrls) {
      // Delete old media
      await prisma.propertyMedia.deleteMany({ where: { propertyId: id } });
      // Create new media
      await prisma.propertyMedia.createMany({
        data: mediaUrls.map((url: string, index: number) => ({
          propertyId: id,
          fileName: `media_${index + 1}.jpg`,
          fileType: "image/jpeg",
          url
        }))
      });
    }

    // 4. Update amenities if provided
    if (amenityIds) {
      // Delete old relations
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: id } });
      // Create new relations
      await prisma.propertyAmenity.createMany({
        data: amenityIds.map((amenityId: string) => ({
          propertyId: id,
          amenityId
        }))
      });
    }

    return res.json({
      message: "Property updated successfully! Sent for re-approval.",
      property: updatedProperty
    });
  } catch (error) {
    console.error("[property update error]", error);
    return res.status(500).json({ error: "Failed to update property details." });
  }
});

/**
 * DELETE /api/properties/:id
 * Soft delete an existing property listing (Restricted to owner SUBAGENT or ADMIN)
 */
router.delete("/:id", authenticateToken, authorizeRoles("SUBAGENT", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    // 1. Fetch property and its agents to check ownership
    const property = await prisma.property.findUnique({
      where: { id },
      include: { agents: true }
    });

    if (!property || property.deletedAt) {
      return res.status(404).json({ error: "Property not found." });
    }

    // Check ownership
    const isOwner = property.agents.some(a => a.subagentId === userId);
    if (!isOwner && role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized. You are not assigned as an agent for this property." });
    }

    // 2. Perform soft delete
    await prisma.property.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: PropertyStatus.ARCHIVED
      }
    });

    return res.json({ message: "Property listing deleted successfully!" });
  } catch (error) {
    console.error("[property delete error]", error);
    return res.status(500).json({ error: "Failed to delete property listing." });
  }
});

/**
 * GET /api/properties/localities/all
 * Fetch all available localities
 */
router.get("/localities/all", async (req, res) => {
  try {
    const localities = await prisma.locality.findMany({
      orderBy: { name: "asc" }
    });
    return res.json(localities);
  } catch (error) {
    console.error("[localities get error]", error);
    return res.status(500).json({ error: "Failed to retrieve localities." });
  }
});

/**
 * GET /api/properties/amenities/all
 * Fetch all available amenities
 */
router.get("/amenities/all", async (req, res) => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: "asc" }
    });
    return res.json(amenities);
  } catch (error) {
    console.error("[amenities get error]", error);
    return res.status(500).json({ error: "Failed to retrieve amenities." });
  }
});

export default router;
