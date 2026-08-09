import { LocalDemoLearningRepository } from "@/data/local-demo-learning-repository";
import { demoStudent, demoTutor } from "@/data/mock-data";
import type { LearningRepository } from "@/domain/repositories/learning-repository";

export class LearningService {
  constructor(private readonly repository: LearningRepository) {}

  async getStudentHome(studentId: string) {
    const [student, mission, patterns] = await Promise.all([
      this.repository.getStudent(studentId),
      this.repository.getTodayMission(studentId),
      this.repository.getMistakePatterns(studentId),
    ]);

    if (!student) {
      return null;
    }

    return { student, mission, patterns };
  }

  async getTutorDashboard(tutorId: string) {
    const [tutor, students, interventions] = await Promise.all([
      this.repository.getTutor(tutorId),
      this.repository.getStudentsForTutor(tutorId),
      this.repository.getInterventions(tutorId),
    ]);

    if (!tutor) {
      return null;
    }

    return { tutor, students, interventions };
  }
}

export const demoLearningService = new LearningService(
  new LocalDemoLearningRepository(),
);

export const demoIds = {
  student: demoStudent.id,
  tutor: demoTutor.id,
} as const;
