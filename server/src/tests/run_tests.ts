import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { extractPreferences, getMissingFields, mergePreferences } from '../modules/extraction/preference.extractor';
import { scoreProperty } from '../modules/recommendation/scorer';
import { isExplainIntent, extractListingIndex, generateExplanation } from '../modules/explanation/explanation.engine';
import { createSession, getSession, addTurn, updatePreferences, saveRecommendations } from '../modules/conversation/session.service';
import { RawProperty, ScoredProperty, UserPreferences } from '../shared/types/session.types';
import visitsRouter from '../routes/visits';
import aiRouter from '../routes/ai';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, message?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}${message ? ': ' + message : ''}`);
  }
}

function createToken(user: { id: string; email: string; role: 'CUSTOMER' | 'SUBAGENT' | 'ADMIN' }) {
  return jwt.sign(user, process.env.JWT_SECRET || 'ai_realty_secret_session_token_key_12345');
}

async function withPrismaMock<T>(patches: Record<string, any>, run: () => Promise<T>): Promise<T> {
  const prisma = (await import('../db')).prisma as any;
  const restored: Array<{ target: any; key: string; value: any }> = [];

  for (const [path, value] of Object.entries(patches)) {
    const segments = path.split('.');
    let target: any = prisma;
    for (let i = 0; i < segments.length - 1; i++) {
      target = target[segments[i]];
    }
    const key = segments[segments.length - 1];
    restored.push({ target, key, value: target[key] });
    target[key] = value;
  }

  try {
    return await run();
  } finally {
    for (const entry of restored) {
      entry.target[entry.key] = entry.value;
    }
  }
}

async function runTests() {
  console.log("==========================================");
  console.log("   RUNNING INTEGRATED CHATBOT TEST SUITE  ");
  console.log("==========================================\n");

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Preference Extractor Tests
  // ───────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Preference Extractor ---");
  
  const test1 = extractPreferences("Looking for a 3 BHK in Powai, budget around 1.5 Cr");
  assert(
    test1.bedroomsMin === 3 && test1.bedroomsMax === 3,
    "Extract BHK count (3 BHK)",
    `Expected beds=3, got bedroomsMin=${test1.bedroomsMin}`
  );
  assert(
    test1.localities?.includes("Powai") === true,
    "Extract locality (Powai)",
    `Expected locality Powai, got ${JSON.stringify(test1.localities)}`
  );
  assert(
    test1.budgetMax === 17250000,
    "Extract budget (1.5 Cr)",
    `Expected 17250000, got ${test1.budgetMax}`
  );

  const test2 = extractPreferences("rent flat under 50k in Bandra West");
  assert(
    test2.listingType === "RENT",
    "Extract listing type (RENT)",
    `Expected RENT, got ${test2.listingType}`
  );
  assert(
    test2.budgetMax === 50000,
    "Extract budget under 50k",
    `Expected 50000, got ${test2.budgetMax}`
  );

  const test3 = extractPreferences("fully furnished 1bhk in Andheri under 30 lakhs");
  assert(
    test3.furnishedStatus === "FURNISHED",
    "Extract furnished status (FURNISHED)",
    `Expected FURNISHED, got ${test3.furnishedStatus}`
  );
  assert(
    test3.budgetMax === 3000000,
    "Extract budget (30 lakhs)",
    `Expected 3000000, got ${test3.budgetMax}`
  );

  // Missing fields check
  const missing1 = getMissingFields({});
  assert(
    missing1.includes("localities") && missing1.includes("budget") && missing1.includes("bedrooms"),
    "Detect all missing fields on empty preferences"
  );

  const missing2 = getMissingFields({ localities: ["Powai"], budgetMax: 10000000 });
  assert(
    missing2.length === 1 && missing2[0] === "bedrooms",
    "Detect bedrooms missing when localities and budget exist"
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Scorer Tests
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Listing Scorer Engine ---");

  const mockProperty: RawProperty = {
    id: "prop-123",
    title: "Sleek 2 BHK Powai Flat",
    price: 12000000, // 1.2 Cr
    beds: 2,
    baths: 2,
    sqft: 950,
    address: "Central Avenue, Powai",
    localityName: "Powai",
    propertyType: "APARTMENT",
    listingType: "SALE",
    furnishedStatus: "SEMI_FURNISHED",
    isResale: false,
    priceSqft: 12631,
    latitude: 19.117,
    longitude: 72.906,
  };

  const perfectPrefs: UserPreferences = {
    localities: ["Powai"],
    budgetMax: 15000000,
    bedroomsMin: 2,
    bedroomsMax: 2,
    propertyType: "APARTMENT",
    listingType: "SALE",
    furnishedStatus: "SEMI_FURNISHED",
    mustHaves: ["ready_to_move"],
  };

  const perfectScore = scoreProperty(mockProperty, perfectPrefs);
  assert(
    perfectScore.score >= 95,
    "Perfect matching preference score",
    `Expected score >= 95, got ${perfectScore.score}`
  );

  const mismatchPrefs: UserPreferences = {
    localities: ["Bandra West"], // wrong locality
    budgetMax: 10000000,        // budget is 1.0 Cr (property is 1.2 Cr)
    bedroomsMin: 3,             // wants 3 BHK (property is 2 BHK)
    propertyType: "VILLA",      // wants VILLA (property is APARTMENT)
  };

  const badScore = scoreProperty(mockProperty, mismatchPrefs);
  assert(
    badScore.score < 30,
    "Poor matching preference score",
    `Expected score < 30, got ${badScore.score}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Explanation Engine Tests
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Explanation Engine ---");

  assert(
    isExplainIntent("why is listing 3 recommended?"),
    "Identify explanation intent",
    "Should be true"
  );
  assert(
    extractListingIndex("tell me more about option 2") === 2,
    "Extract listing index from query",
    "Expected 2"
  );

  const scoredProp: ScoredProperty = {
    ...mockProperty,
    score: 95,
    breakdown: {
      budget: 30,
      beds: 20,
      locality: 20,
      listingType: 10,
    }
  };

  const explanation = await generateExplanation(scoredProp, perfectPrefs, 1);
  assert(
    explanation.includes("Sleek 2 BHK Powai Flat") && explanation.includes("Powai") && explanation.includes("1.20 Crore"),
    "Generate accurate template explanation",
    `Explanation: "${explanation}"`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Session Service Tests
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Session Service ---");

  const session = createSession();
  assert(
    session.sessionId !== undefined && session.turns.length === 0,
    "Create session successfully"
  );

  addTurn(session.sessionId, 'user', "Hello, search flats.");
  addTurn(session.sessionId, 'model', "Sure, which locality?");
  const updatedSess = getSession(session.sessionId);
  assert(
    updatedSess !== null && updatedSess.turns.length === 2,
    "Add chat turns to session"
  );

  updatePreferences(session.sessionId, { localities: ["Powai"] });
  const finalSess = getSession(session.sessionId)!;
  assert(
    finalSess.preferences.localities?.includes("Powai") === true,
    "Update session user preferences"
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Portal Flow Tests (chat, scheduling, AI routes)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Portal Flow Tests ---");

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'ai_realty_secret_session_token_key_12345';
  const app = express();
  app.use(express.json());
  app.use('/api/visits', visitsRouter);
  app.use('/api/ai', aiRouter);

  const customerToken = createToken({ id: 'customer-1', email: 'customer@example.com', role: 'CUSTOMER' });
  const subagentToken = createToken({ id: 'subagent-1', email: 'agent@example.com', role: 'SUBAGENT' });
  const adminToken = createToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

  const chatRes = await request(app)
    .post('/api/ai/chat')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ message: 'hi' });
  assert(chatRes.status === 200, 'Customer chat endpoint responds to greeting', `Expected 200, got ${chatRes.status}`);
  assert(typeof chatRes.body.reply === 'string' && chatRes.body.reply.length > 0, 'Customer chat endpoint returns a greeting reply');
  assert(Boolean(chatRes.body.sessionId), 'Customer chat endpoint returns a session id');

  const sessionStateRes = await request(app)
    .get(`/api/ai/chat/${chatRes.body.sessionId}`)
    .set('Authorization', `Bearer ${customerToken}`);
  assert(sessionStateRes.status === 200, 'Chat session state endpoint returns session data', `Expected 200, got ${sessionStateRes.status}`);
  assert(sessionStateRes.body.turnCount >= 2, 'Chat session state includes the stored turns', `Expected at least 2 turns, got ${sessionStateRes.body.turnCount}`);

  await withPrismaMock(
    {
      'visitSchedule.findMany': async () => [{ id: 'visit-1', status: 'REQUESTED', scheduledAt: new Date() }],
    },
    async () => {
      const visitsRes = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${customerToken}`);
      assert(visitsRes.status === 200, 'Customer can fetch visit schedules', `Expected 200, got ${visitsRes.status}`);
      assert(Array.isArray(visitsRes.body) && visitsRes.body.length > 0, 'Visit list response contains visit records');
    }
  );

  await withPrismaMock(
    {
      'property.findUnique': async () => ({ id: 'property-1', agents: [] }),
      'visitSchedule.create': async ({ data }: any) => ({ id: 'visit-created', ...data }),
    },
    async () => {
      const createVisitRes = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ propertyId: 'property-1', scheduledAt: '2026-08-01T10:00:00.000Z', notes: 'Please confirm' });
      assert(createVisitRes.status === 201, 'Customer can request a visit', `Expected 201, got ${createVisitRes.status}`);
      assert(createVisitRes.body.visit?.id === 'visit-created', 'Visit request response includes the created visit');
    }
  );

  await withPrismaMock(
    {
      'visitSchedule.findUnique': async () => ({ id: 'visit-2', subagentId: 'subagent-1', status: 'REQUESTED', notes: null }),
      'visitSchedule.update': async ({ data }: any) => ({ id: 'visit-2', ...data }),
    },
    async () => {
      const updateVisitRes = await request(app)
        .put('/api/visits/visit-2/status')
        .set('Authorization', `Bearer ${subagentToken}`)
        .send({ status: 'APPROVED', notes: 'Confirmed' });
      assert(updateVisitRes.status === 200, 'Subagent can update visit status', `Expected 200, got ${updateVisitRes.status}`);
      assert(updateVisitRes.body.visit?.status === 'APPROVED', 'Visit status update persists', `Got ${updateVisitRes.body.visit?.status}`);
    }
  );

  await withPrismaMock(
    {
      'aIReport.findMany': async () => [{ id: 'report-1', title: 'AI Value Report', status: 'COMPLETED' }],
    },
    async () => {
      const reportsRes = await request(app)
        .get('/api/ai/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      assert(reportsRes.status === 200, 'Admin can fetch AI reports', `Expected 200, got ${reportsRes.status}`);
      assert(Array.isArray(reportsRes.body) && reportsRes.body.length > 0, 'AI reports endpoint returns report records');
    }
  );

  await withPrismaMock(
    {
      'property.findUnique': async () => ({ id: 'property-2', title: 'Luxury Loft', price: 5000000, locality: { poi: null } }),
      'aIReport.create': async ({ data }: any) => ({ id: 'report-created', ...data }),
    },
    async () => {
      const generateReportRes = await request(app)
        .post('/api/ai/reports/generate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ propertyId: 'property-2', type: 'VALUE' });
      assert(generateReportRes.status === 201, 'Customer can generate an AI report', `Expected 201, got ${generateReportRes.status}`);
      assert(generateReportRes.body.report?.id === 'report-created', 'AI report generation returns the created report');
    }
  );

  let recommendationFindManyCalls = 0;
  await withPrismaMock(
    {
      'customerPreference.findUnique': async () => null,
      'propertyRecommendation.findMany': async () => {
        recommendationFindManyCalls += 1;
        if (recommendationFindManyCalls === 1) return [];
        return [{ id: 'rec-1', score: 78, explanation: 'Great match', property: { id: 'property-3', title: 'Sea View Flat', locality: { name: 'Bandra' }, media: [] } }];
      },
      'property.findMany': async () => [{ id: 'property-3', title: 'Sea View Flat', price: 7000000, propertyType: 'APARTMENT', locality: { name: 'Bandra', poi: null, intelligence: null }, media: [] }],
      'propertyRecommendation.createMany': async ({ data }: any) => ({ count: data.length }),
    },
    async () => {
      const recommendationsRes = await request(app)
        .get('/api/ai/recommendations')
        .set('Authorization', `Bearer ${customerToken}`);
      assert(recommendationsRes.status === 200, 'Customer can fetch AI recommendations', `Expected 200, got ${recommendationsRes.status}`);
      assert(Array.isArray(recommendationsRes.body) && recommendationsRes.body.length > 0, 'AI recommendations endpoint returns generated recommendations');
    }
  );

  await withPrismaMock(
    {
      'customerPreference.upsert': async ({ create, update }: any) => ({ userId: 'customer-1', preferences: create?.preferences || update?.preferences || {} }),
      'propertyRecommendation.deleteMany': async () => ({ count: 1 }),
    },
    async () => {
      const preferencesRes = await request(app)
        .put('/api/ai/preferences')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ preferences: { maxPrice: 8000000, propertyType: 'APARTMENT' } });
      assert(preferencesRes.status === 200, 'Customer can save AI preferences', `Expected 200, got ${preferencesRes.status}`);
      assert(Boolean(preferencesRes.body.preferences), 'AI preference save returns the stored preference payload');
    }
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n==========================================");
  console.log(`   TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log("==========================================");

  if (passedTests === totalTests) {
    console.log("🎉 All integration tests passed successfully!\n");
    process.exit(0);
  } else {
    console.error("❌ Some integration tests failed.\n");
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
