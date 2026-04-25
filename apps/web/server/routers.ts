import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAide,
  createAvatar,
  createFusionResult,
  createSession,
  endSession,
  getAideById,
  getAides,
  getAvatarById,
  getAvatarProgress,
  getAvatars,
  getBurnoutAssessments,
  getCoachingActions,
  getDashboardStats,
  getFusionResults,
  getMetrics,
  getSessionById,
  getTaskResults,
  getTrainingSessions,
  updateSessionStatus,
} from "./db";

// ---------------------------------------------------------------------------
// Helper: admin or owner check
// ---------------------------------------------------------------------------
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),

  // -------------------------------------------------------------------------
  // Avatars
  // -------------------------------------------------------------------------
  avatars: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      // Admins see all avatars (including demo/unowned), users see their own + demo
      return getAvatars(ctx.user.id, isAdmin);
    }),

    get: protectedProcedure
      .input(z.object({ avatarId: z.string() }))
      .query(async ({ input }) => {
        const avatar = await getAvatarById(input.avatarId);
        if (!avatar) throw new TRPCError({ code: "NOT_FOUND" });
        return avatar;
      }),

    progress: protectedProcedure
      .input(z.object({ avatarId: z.string() }))
      .query(async ({ input }) => {
        return getAvatarProgress(input.avatarId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          traitName: z.string().min(1).max(128),
          traitDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const avatarId = `av-${randomUUID().slice(0, 8)}`;
        return createAvatar({ avatarId, ...input, ownerId: ctx.user.id });
      }),
  }),

  // -------------------------------------------------------------------------
  // Aides
  // -------------------------------------------------------------------------
  aides: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      return getAides(ctx.user.id, isAdmin);
    }),

    get: protectedProcedure
      .input(z.object({ aideId: z.string() }))
      .query(async ({ input }) => {
        const aide = await getAideById(input.aideId);
        if (!aide) throw new TRPCError({ code: "NOT_FOUND" });
        return aide;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          expertiseArea: z.string().optional(),
          coachingStrategies: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const aideId = `aide-${randomUUID().slice(0, 8)}`;
        return createAide({
          aideId,
          name: input.name,
          expertiseArea: input.expertiseArea,
          coachingStrategies: JSON.stringify(input.coachingStrategies ?? []),
          ownerId: ctx.user.id,
        });
      }),
  }),

  // -------------------------------------------------------------------------
  // Training Sessions
  // -------------------------------------------------------------------------
  sessions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      return getTrainingSessions(ctx.user.id, isAdmin);
    }),

    get: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        return session;
      }),

    taskResults: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getTaskResults(input.sessionId);
      }),

    coachingActions: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getCoachingActions(input.sessionId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          avatarId: z.string(),
          aideId: z.string(),
          scenarioId: z.string().optional(),
          scenarioName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionId = `sess-${randomUUID().slice(0, 8)}`;
        return createSession({ sessionId, ...input, ownerId: ctx.user.id });
      }),

    end: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        return endSession(input.sessionId);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          sessionId: z.string(),
          status: z.enum(["active", "completed", "failed", "paused"]),
        })
      )
      .mutation(async ({ input }) => {
        return updateSessionStatus(input.sessionId, input.status);
      }),
  }),

  // -------------------------------------------------------------------------
  // Burnout Monitoring
  // -------------------------------------------------------------------------
  burnout: router({
    list: protectedProcedure
      .input(z.object({ avatarId: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getBurnoutAssessments(input.avatarId, input.limit ?? 50);
      }),

    latestPerAvatar: protectedProcedure.query(async () => {
      const all = await getBurnoutAssessments(undefined, 200);
      // Deduplicate: keep latest per avatar
      const seen = new Map<string, (typeof all)[0]>();
      for (const a of all) {
        if (!seen.has(a.avatarId)) seen.set(a.avatarId, a);
      }
      return Array.from(seen.values());
    }),
  }),

  // -------------------------------------------------------------------------
  // Analytics / Metrics
  // -------------------------------------------------------------------------
  analytics: router({
    metrics: protectedProcedure
      .input(
        z.object({
          avatarId: z.string().optional(),
          metricType: z.string().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return getMetrics(input.avatarId, input.metricType, input.limit ?? 100);
      }),
  }),

  // -------------------------------------------------------------------------
  // Fusion Engine
  // -------------------------------------------------------------------------
  fusion: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      return getFusionResults(ctx.user.id, isAdmin);
    }),

    assessReadiness: protectedProcedure
      .input(z.object({ avatarId: z.string(), aideId: z.string() }))
      .query(async ({ input }) => {
        const [avatar, aide] = await Promise.all([
          getAvatarById(input.avatarId),
          getAideById(input.aideId),
        ]);
        if (!avatar || !aide) throw new TRPCError({ code: "NOT_FOUND" });

        // Compute readiness dimensions
        const independenceScore = avatar.independenceLevel ?? 0;
        const taskMasteryScore = avatar.totalTasksAttempted
          ? (avatar.totalTasksCompleted ?? 0) / avatar.totalTasksAttempted
          : 0;
        const emotionalRegulationScore =
          1 - (avatar.stressLevel ?? 0) * 0.5 - (avatar.cognitiveLoad ?? 0) * 0.3;
        const aideEffectivenessScore = aide.effectivenessScore ?? 0;
        const sessionQualityScore =
          aide.totalInterventions
            ? (aide.successfulInterventions ?? 0) / aide.totalInterventions
            : 0;

        const overallScore =
          independenceScore * 0.3 +
          taskMasteryScore * 0.2 +
          Math.max(0, emotionalRegulationScore) * 0.2 +
          aideEffectivenessScore * 0.15 +
          sessionQualityScore * 0.15;

        const isReady = overallScore >= 0.7 && independenceScore >= 0.7;

        return {
          avatarId: input.avatarId,
          aideId: input.aideId,
          avatarName: avatar.traitName,
          aideName: aide.name,
          overallScore: parseFloat(overallScore.toFixed(3)),
          isReady,
          dimensions: {
            independence: parseFloat(independenceScore.toFixed(3)),
            task_mastery: parseFloat(taskMasteryScore.toFixed(3)),
            emotional_regulation: parseFloat(Math.max(0, emotionalRegulationScore).toFixed(3)),
            aide_effectiveness: parseFloat(aideEffectivenessScore.toFixed(3)),
            session_quality: parseFloat(sessionQualityScore.toFixed(3)),
          },
          blockers: [
            ...(!isReady && independenceScore < 0.7
              ? [`Independence level ${(independenceScore * 100).toFixed(0)}% < 70% required`]
              : []),
            ...(!isReady && overallScore < 0.7
              ? [`Overall readiness ${(overallScore * 100).toFixed(0)}% < 70% threshold`]
              : []),
          ],
        };
      }),

    trigger: protectedProcedure
      .input(z.object({ avatarId: z.string(), aideId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const [avatar, aide] = await Promise.all([
          getAvatarById(input.avatarId),
          getAideById(input.aideId),
        ]);
        if (!avatar || !aide) throw new TRPCError({ code: "NOT_FOUND" });

        const independenceScore = avatar.independenceLevel ?? 0;
        const taskMasteryScore = avatar.totalTasksAttempted
          ? (avatar.totalTasksCompleted ?? 0) / avatar.totalTasksAttempted
          : 0;
        const emotionalRegulationScore = Math.max(
          0,
          1 - (avatar.stressLevel ?? 0) * 0.5 - (avatar.cognitiveLoad ?? 0) * 0.3
        );
        const aideEffectivenessScore = aide.effectivenessScore ?? 0;
        const sessionQualityScore = aide.totalInterventions
          ? (aide.successfulInterventions ?? 0) / aide.totalInterventions
          : 0;

        const overallScore =
          independenceScore * 0.3 +
          taskMasteryScore * 0.2 +
          emotionalRegulationScore * 0.2 +
          aideEffectivenessScore * 0.15 +
          sessionQualityScore * 0.15;

        const isReady = overallScore >= 0.7 && independenceScore >= 0.7;

        const dimensionScores = {
          independence: parseFloat(independenceScore.toFixed(3)),
          task_mastery: parseFloat(taskMasteryScore.toFixed(3)),
          emotional_regulation: parseFloat(emotionalRegulationScore.toFixed(3)),
          aide_effectiveness: parseFloat(aideEffectivenessScore.toFixed(3)),
          session_quality: parseFloat(sessionQualityScore.toFixed(3)),
        };

        let empathyLevel: "surface" | "experiential" | "deep" | "transformative" | undefined;
        if (isReady) {
          if (overallScore >= 0.9) empathyLevel = "transformative";
          else if (overallScore >= 0.8) empathyLevel = "deep";
          else if (overallScore >= 0.7) empathyLevel = "experiential";
          else empathyLevel = "surface";
        }

        const fusionId = `fusion-${randomUUID().slice(0, 8)}`;
        const advocateName = isReady
          ? `${avatar.traitName} × ${aide.name} Advocate`
          : undefined;

        return createFusionResult({
          fusionId,
          avatarId: input.avatarId,
          aideId: input.aideId,
          success: isReady,
          readinessScore: parseFloat(overallScore.toFixed(3)),
          failureReason: isReady
            ? undefined
            : `Readiness score ${(overallScore * 100).toFixed(0)}% below 70% threshold`,
          advocateName,
          empathyLevel,
          dimensionScores: JSON.stringify(dimensionScores),
          ownerId: ctx.user.id,
        });
      }),
  }),

  // -------------------------------------------------------------------------
  // Scheduled task endpoint (for future use)
  // -------------------------------------------------------------------------
  scheduled: router({
    ping: publicProcedure.query(() => ({ ok: true })),
  }),
});

export type AppRouter = typeof appRouter;
