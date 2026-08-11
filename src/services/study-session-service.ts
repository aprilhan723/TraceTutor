import { getPracticeItem } from "@/data/practice-content";
import type { AdaptiveSessionPlan } from "@/services/session-planner";
import type {
  MissionItemRef,
  StudentStudyState,
  StudyMission,
  StudySession,
  StudySessionSource,
  StudyTopic,
} from "@/domain/study";

function partForItem(itemId: string): MissionItemRef["part"] {
  const item = getPracticeItem(itemId);
  if (item?.kind === "transfer") return "transfer";
  if (item?.kind === "complete-words") return "speed";
  return "thinking";
}

function sessionEntryId(sessionId: string, blockId: string, itemId: string) {
  return `session-${sessionId}-${blockId}-${itemId}`;
}

export function attachAdaptiveSession(input: {
  state: StudentStudyState;
  plan: AdaptiveSessionPlan;
  topic: StudyTopic;
  includeDueReviews: boolean;
  timed: boolean;
  source: StudySessionSource;
  nowIso: string;
}): StudentStudyState {
  const { state, plan, nowIso } = input;
  const currentMission = state.activeMission;
  if (!currentMission || currentMission.completedAt) return state;

  const sessionId = `study-${currentMission.dateKey}-${nowIso.replace(/\D/g, "").slice(8, 14)}`;
  const resolvedCoreEntryIds = currentMission.dailyCoreEntryIds?.length
    ? currentMission.dailyCoreEntryIds
    : currentMission.items.map((entry) => entry.entryId);
  const coreIds = new Set(resolvedCoreEntryIds);
  const missionItems = [...currentMission.items];
  const blocks = plan.blocks.map((block) => {
    if (block.activityType === "daily-core") {
      return {
        ...block,
        missionEntryIds: missionItems
          .filter((entry) => coreIds.has(entry.entryId))
          .map((entry) => entry.entryId),
      };
    }
    const missionEntryIds = block.itemIds.map((itemId) => {
      const entryId = sessionEntryId(sessionId, block.id, itemId);
      missionItems.push({
        entryId,
        itemId,
        part: partForItem(itemId),
        selectionReason: block.detail,
      });
      return entryId;
    });
    return { ...block, missionEntryIds };
  });
  const firstActionable = blocks.findIndex(
    (block) => block.missionEntryIds.length > 0,
  );
  const normalizedBlocks = blocks.map((block, index) => ({
    ...block,
    status:
      index === firstActionable
        ? ("active" as const)
        : block.status === "active"
          ? ("upcoming" as const)
          : block.status,
  }));
  const session: StudySession = {
    id: sessionId,
    learnerId: state.studentId,
    sessionType: plan.sessionType,
    topic: input.topic,
    plannedMinutes: plan.requestedMinutes,
    availableMinutes: plan.availableMinutes,
    activeSeconds: 0,
    startedAt: nowIso,
    lastActivityAt: nowIso,
    completedAt: null,
    pausedAt: null,
    status: "active",
    questionsAnswered: 0,
    correctAnswers: 0,
    dueReviewsCompleted: 0,
    transferItemsCompleted: 0,
    diagnosticLoopsCompleted: 0,
    source: input.source,
    includeDueReviews: input.includeDueReviews,
    timed: input.timed,
    blocks: normalizedBlocks,
    contentShortage: plan.contentShortage,
    shortageMessage: plan.shortageMessage,
    endedAfterBlockId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const firstEntryId = normalizedBlocks[firstActionable]?.missionEntryIds[0];
  const firstIndex = firstEntryId
    ? missionItems.findIndex((entry) => entry.entryId === firstEntryId)
    : currentMission.currentIndex;
  const mission: StudyMission = {
    ...currentMission,
    mode: "study-session",
    sessionId,
    dailyCoreEntryIds: resolvedCoreEntryIds,
    title: `${plan.requestedMinutes}-minute personalized study session`,
    estimatedMinutes: plan.availableMinutes,
    items: missionItems,
    currentIndex: Math.max(0, firstIndex),
    lastSavedAt: nowIso,
  };
  return {
    ...state,
    activeMission: mission,
    activeSessionId: sessionId,
    studySessions: [...state.studySessions, session],
    updatedAt: nowIso,
  };
}

export function updateSessionForAttempt(input: {
  state: StudentStudyState;
  missionEntryId: string;
  correct: boolean;
  result: "secure" | "unstable" | "diagnose";
  nowIso: string;
}) {
  const sessionId = input.state.activeMission?.sessionId;
  if (!sessionId) return input.state;
  const nextSessions = input.state.studySessions.map((session) => {
    if (session.id !== sessionId || session.status === "completed") {
      return session;
    }
    const matched = session.blocks.find((block) =>
      block.missionEntryIds.includes(input.missionEntryId),
    );
    if (!matched) return session;
    const attemptIds = input.state.activeMission?.attemptIdsByEntry ?? {};
    const blocks = session.blocks.map((block) => {
      if (block.id !== matched.id) return block;
      const completed = block.missionEntryIds.every(
        (entryId) =>
          entryId === input.missionEntryId || Boolean(attemptIds[entryId]),
      );
      return {
        ...block,
        status: completed ? ("completed" as const) : ("active" as const),
      };
    });
    return {
      ...session,
      questionsAnswered: session.questionsAnswered + 1,
      correctAnswers: session.correctAnswers + (input.correct ? 1 : 0),
      dueReviewsCompleted:
        session.dueReviewsCompleted +
        (matched.activityType === "due-review" ? 1 : 0),
      transferItemsCompleted:
        session.transferItemsCompleted +
        (matched.activityType === "transfer" ? 1 : 0),
      diagnosticLoopsCompleted:
        session.diagnosticLoopsCompleted +
        (input.result === "diagnose" ? 1 : 0),
      blocks,
      lastActivityAt: input.nowIso,
      updatedAt: input.nowIso,
    };
  });
  return {
    ...input.state,
    studySessions: nextSessions,
    updatedAt: input.nowIso,
  };
}

export function continueStudySession(
  state: StudentStudyState,
  sessionId: string,
  nowIso: string,
) {
  const session = state.studySessions.find(
    (candidate) => candidate.id === sessionId,
  );
  const mission = state.activeMission;
  if (!session || !mission || mission.sessionId !== sessionId) return state;
  const currentBlock = session.blocks.find(
    (block) =>
      block.status === "active" &&
      block.missionEntryIds.some(
        (entryId) => !mission.attemptIdsByEntry[entryId],
      ),
  );
  const currentEntryId = currentBlock?.missionEntryIds.find(
    (entryId) => !mission.attemptIdsByEntry[entryId],
  );
  if (currentEntryId) {
    const currentIndex = mission.items.findIndex(
      (entry) => entry.entryId === currentEntryId,
    );
    return {
      ...state,
      activeSessionId: sessionId,
      activeMission: { ...mission, currentIndex, lastSavedAt: nowIso },
      studySessions: state.studySessions.map((candidate) =>
        candidate.id === sessionId
          ? {
              ...candidate,
              status: "active" as const,
              pausedAt: null,
              updatedAt: nowIso,
            }
          : candidate,
      ),
      updatedAt: nowIso,
    };
  }
  const nextBlock = session.blocks.find(
    (block) =>
      block.status === "upcoming" &&
      block.missionEntryIds.some(
        (entryId) => !mission.attemptIdsByEntry[entryId],
      ),
  );
  const nextEntryId = nextBlock?.missionEntryIds.find(
    (entryId) => !mission.attemptIdsByEntry[entryId],
  );
  if (!nextBlock || !nextEntryId)
    return finishStudySession(state, sessionId, nowIso);
  const nextIndex = mission.items.findIndex(
    (entry) => entry.entryId === nextEntryId,
  );
  const nextBlockIndex = session.blocks.findIndex(
    (block) => block.id === nextBlock.id,
  );
  return {
    ...state,
    activeSessionId: sessionId,
    activeMission: { ...mission, currentIndex: nextIndex, lastSavedAt: nowIso },
    studySessions: state.studySessions.map((candidate) =>
      candidate.id === sessionId
        ? {
            ...candidate,
            status: "active" as const,
            pausedAt: null,
            blocks: candidate.blocks.map((block) =>
              block.id === nextBlock.id
                ? { ...block, status: "active" as const }
                : candidate.blocks.findIndex((entry) => entry.id === block.id) <
                      nextBlockIndex &&
                    block.status === "upcoming" &&
                    block.missionEntryIds.length === 0
                  ? { ...block, status: "completed" as const }
                  : block,
            ),
            updatedAt: nowIso,
          }
        : candidate,
    ),
    updatedAt: nowIso,
  };
}

export function pauseStudySession(
  state: StudentStudyState,
  sessionId: string,
  nowIso: string,
) {
  return {
    ...state,
    studySessions: state.studySessions.map((session) =>
      session.id === sessionId && session.status === "active"
        ? {
            ...session,
            status: "paused" as const,
            pausedAt: nowIso,
            updatedAt: nowIso,
          }
        : session,
    ),
    updatedAt: nowIso,
  };
}

export function addSessionActiveSeconds(
  state: StudentStudyState,
  sessionId: string,
  seconds: number,
  nowIso: string,
) {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 90) return state;
  if (
    !state.studySessions.some(
      (session) => session.id === sessionId && session.status === "active",
    )
  ) {
    return state;
  }
  return {
    ...state,
    studySessions: state.studySessions.map((session) =>
      session.id === sessionId && session.status === "active"
        ? {
            ...session,
            activeSeconds: session.activeSeconds + Math.round(seconds),
            lastActivityAt: nowIso,
            updatedAt: nowIso,
          }
        : session,
    ),
    updatedAt: nowIso,
  };
}

export function finishStudySession(
  state: StudentStudyState,
  sessionId: string,
  nowIso: string,
  afterBlockId: string | null = null,
) {
  return {
    ...state,
    activeSessionId:
      state.activeSessionId === sessionId ? null : state.activeSessionId,
    studySessions: state.studySessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            status: "completed" as const,
            completedAt: nowIso,
            pausedAt: null,
            endedAfterBlockId: afterBlockId,
            blocks: session.blocks.map((block) =>
              block.status === "upcoming"
                ? { ...block, status: "skipped" as const }
                : block,
            ),
            updatedAt: nowIso,
          }
        : session,
    ),
    activeMission:
      state.activeMission?.sessionId === sessionId
        ? { ...state.activeMission, completedAt: nowIso, lastSavedAt: nowIso }
        : state.activeMission,
    updatedAt: nowIso,
  };
}
