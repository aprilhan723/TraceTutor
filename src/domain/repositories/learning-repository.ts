import type {
  DailyMission,
  Intervention,
  MistakePattern,
  Student,
  Tutor,
} from "@/domain/models";
import type { StudentStudyState } from "@/domain/study";
import type { TutorWorkspaceState } from "@/domain/tutor";

export interface LearningRepository {
  getStudent(studentId: string): Promise<Student | null>;
  getTutor(tutorId: string): Promise<Tutor | null>;
  getStudentsForTutor(tutorId: string): Promise<Student[]>;
  getTodayMission(studentId: string): Promise<DailyMission | null>;
  getMistakePatterns(studentId: string): Promise<MistakePattern[]>;
  getInterventions(tutorId: string): Promise<Intervention[]>;
  getStudyState(studentId: string): Promise<StudentStudyState>;
  saveStudyState(state: StudentStudyState): Promise<void>;
  resetStudyState(studentId: string): Promise<StudentStudyState>;
  getTutorWorkspace(tutorId: string): Promise<TutorWorkspaceState>;
  saveTutorWorkspace(state: TutorWorkspaceState): Promise<void>;
  resetTutorWorkspace(tutorId: string): Promise<TutorWorkspaceState>;
}
