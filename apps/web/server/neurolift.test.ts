import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ---------------------------------------------------------------------------
// Mock database helpers
// ---------------------------------------------------------------------------
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getAvatars: vi.fn().mockResolvedValue([
    {
      id: 1, avatarId: "av-test", traitName: "TestAvatar", traitDescription: "Test",
      currentState: "learning", emotionalState: "focused", cognitiveLoad: 0.5,
      stressLevel: 0.4, burnoutRiskLevel: "medium", independenceLevel: 0.6,
      totalTasksAttempted: 10, totalTasksCompleted: 7, totalCoachingSessions: 3,
      ownerId: null, createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  getAvatarById: vi.fn().mockImplementation((id: string) =>
    id === "av-test"
      ? Promise.resolve({
          id: 1, avatarId: "av-test", traitName: "TestAvatar", traitDescription: "Test",
          currentState: "learning", emotionalState: "focused", cognitiveLoad: 0.5,
          stressLevel: 0.4, burnoutRiskLevel: "medium", independenceLevel: 0.75,
          totalTasksAttempted: 10, totalTasksCompleted: 8, totalCoachingSessions: 3,
          ownerId: null, createdAt: new Date(), updatedAt: new Date(),
        })
      : Promise.resolve(null)
  ),
  getAvatarProgress: vi.fn().mockResolvedValue([]),
  createAvatar: vi.fn().mockImplementation((data: any) =>
    Promise.resolve({ id: 99, ...data, currentState: "idle", createdAt: new Date(), updatedAt: new Date() })
  ),
  getAides: vi.fn().mockResolvedValue([
    {
      id: 1, aideId: "aide-test", name: "TestAide", expertiseArea: "Focus",
      coachingStrategies: '["Pomodoro"]', effectivenessScore: 0.8,
      totalInterventions: 100, successfulInterventions: 80,
      ownerId: null, createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  getAideById: vi.fn().mockImplementation((id: string) =>
    id === "aide-test"
      ? Promise.resolve({
          id: 1, aideId: "aide-test", name: "TestAide", expertiseArea: "Focus",
          coachingStrategies: '["Pomodoro"]', effectivenessScore: 0.8,
          totalInterventions: 100, successfulInterventions: 80,
          ownerId: null, createdAt: new Date(), updatedAt: new Date(),
        })
      : Promise.resolve(null)
  ),
  createAide: vi.fn().mockImplementation((data: any) =>
    Promise.resolve({ id: 99, ...data, createdAt: new Date(), updatedAt: new Date() })
  ),
  getTrainingSessions: vi.fn().mockResolvedValue([]),
  getSessionById: vi.fn().mockResolvedValue(null),
  createSession: vi.fn().mockImplementation((data: any) =>
    Promise.resolve({ id: 99, ...data, status: "active", startTime: new Date(), createdAt: new Date() })
  ),
  endSession: vi.fn().mockResolvedValue({ status: "completed" }),
  updateSessionStatus: vi.fn().mockResolvedValue({ status: "paused" }),
  getTaskResults: vi.fn().mockResolvedValue([]),
  getCoachingActions: vi.fn().mockResolvedValue([]),
  getBurnoutAssessments: vi.fn().mockResolvedValue([]),
  getLatestBurnoutPerAvatar: vi.fn().mockResolvedValue([]),
  getMetrics: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    activeSessions: 2, totalAvatars: 5, totalAides: 4, highBurnoutCount: 1, fusionReadyCount: 2,
  }),
  getFusionResults: vi.fn().mockResolvedValue([]),
  createFusionResult: vi.fn().mockImplementation((data: any) =>
    Promise.resolve({ id: 99, ...data, createdAt: new Date() })
  ),
}));

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------
type AuthUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1, openId: "test-user", email: "test@example.com", name: "Test User",
    loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(),
    lastSignedIn: new Date(), ...overrides,
  };
}

function makeCtx(user: AuthUser | null = makeUser()): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: {
      clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
    } as any,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("auth", () => {
  it("me returns current user", async () => {
    const user = makeUser();
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result).toMatchObject({ id: 1, openId: "test-user" });
  });

  it("me returns null for unauthenticated", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      user: makeUser(),
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }) } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0].name).toBe(COOKIE_NAME);
    expect(clearedCookies[0].opts).toMatchObject({ maxAge: -1 });
  });
});

describe("dashboard", () => {
  it("stats returns aggregated counts", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const stats = await caller.dashboard.stats();
    expect(stats.activeSessions).toBe(2);
    expect(stats.totalAvatars).toBe(5);
    expect(stats.fusionReadyCount).toBe(2);
  });
});

describe("avatars", () => {
  it("list returns avatars", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.avatars.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].avatarId).toBe("av-test");
  });

  it("get returns avatar by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.avatars.get({ avatarId: "av-test" });
    expect(result.traitName).toBe("TestAvatar");
  });

  it("get throws NOT_FOUND for unknown id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.avatars.get({ avatarId: "nonexistent" })).rejects.toThrow("NOT_FOUND");
  });

  it("create returns new avatar", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.avatars.create({ traitName: "NewTrait", traitDescription: "Test" });
    expect(result?.traitName).toBe("NewTrait");
  });
});

describe("aides", () => {
  it("list returns aides", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.aides.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe("TestAide");
  });

  it("get returns aide by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.aides.get({ aideId: "aide-test" });
    expect(result.expertiseArea).toBe("Focus");
  });

  it("create returns new aide", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.aides.create({
      name: "NewAide",
      expertiseArea: "Memory",
      coachingStrategies: ["Spaced Repetition"],
    });
    expect(result?.name).toBe("NewAide");
  });
});

describe("sessions", () => {
  it("create starts a new session", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.create({
      avatarId: "av-test",
      aideId: "aide-test",
      scenarioName: "Test Scenario",
    });
    expect(result?.status).toBe("active");
    expect(result?.avatarId).toBe("av-test");
  });

  it("updateStatus changes session status", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.sessions.updateStatus({ sessionId: "sess-123", status: "paused" });
    expect(result?.status).toBe("paused");
  });
});

describe("fusion", () => {
  it("assessReadiness computes readiness score", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.fusion.assessReadiness({ avatarId: "av-test", aideId: "aide-test" });
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
    expect(typeof result.isReady).toBe("boolean");
    expect(result.dimensions).toHaveProperty("independence");
    expect(result.dimensions).toHaveProperty("aide_effectiveness");
  });

  it("assessReadiness marks ready when independence >= 0.7 and score >= 0.7", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.fusion.assessReadiness({ avatarId: "av-test", aideId: "aide-test" });
    // av-test has independenceLevel 0.75 and aide has effectivenessScore 0.8
    // Should be ready
    expect(result.isReady).toBe(true);
  });

  it("trigger creates a fusion result", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.fusion.trigger({ avatarId: "av-test", aideId: "aide-test" });
    expect(result).toBeTruthy();
    expect(typeof result?.success).toBe("boolean");
    expect(result?.readinessScore).toBeGreaterThan(0);
  });

  it("assessReadiness throws NOT_FOUND for unknown avatar", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.fusion.assessReadiness({ avatarId: "nonexistent", aideId: "aide-test" })
    ).rejects.toThrow("NOT_FOUND");
  });
});

describe("burnout", () => {
  it("list returns assessments", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.burnout.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("latestPerAvatar returns deduplicated list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.burnout.latestPerAvatar();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("analytics", () => {
  it("metrics returns metric data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.metrics({ metricType: "session_success_rate" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin access control", () => {
  it("regular user can list avatars", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "user" })));
    const result = await caller.avatars.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin user can list avatars", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    const result = await caller.avatars.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot access protected procedures", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.avatars.list()).rejects.toThrow();
  });
});
