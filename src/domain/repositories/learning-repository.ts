import type {
  DailyMission,
  Intervention,
  MistakePattern,
  Student,
  Tutor,
} from "@/domain/models";

export interface LearningRepository {
  getStudent(studentId: string): Promise<Student | null>;
  getTutor(tutorId: string): Promise<Tutor | null>;
  getStudentsForTutor(tutorId: string): Promise<Student[]>;
  getTodayMission(studentId: string): Promise<DailyMission | null>;
  getMistakePatterns(studentId: string): Promise<MistakePattern[]>;
  getInterventions(tutorId: string): Promise<Intervention[]>;
}
