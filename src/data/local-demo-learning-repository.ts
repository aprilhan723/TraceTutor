import {
  demoInterventions,
  demoMission,
  demoMistakePatterns,
  demoStudent,
  demoTutor,
} from "@/data/mock-data";
import type { LearningRepository } from "@/domain/repositories/learning-repository";

export class LocalDemoLearningRepository implements LearningRepository {
  async getStudent(studentId: string) {
    return studentId === demoStudent.id ? demoStudent : null;
  }

  async getTutor(tutorId: string) {
    return tutorId === demoTutor.id ? demoTutor : null;
  }

  async getStudentsForTutor(tutorId: string) {
    return tutorId === demoTutor.id ? [demoStudent] : [];
  }

  async getTodayMission(studentId: string) {
    return studentId === demoStudent.id ? demoMission : null;
  }

  async getMistakePatterns(studentId: string) {
    return studentId === demoStudent.id ? demoMistakePatterns : [];
  }

  async getInterventions(tutorId: string) {
    return tutorId === demoTutor.id ? demoInterventions : [];
  }
}
