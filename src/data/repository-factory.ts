import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LocalDemoLearningRepository,
  type KeyValueStore,
} from "@/data/local-demo-learning-repository";
import { SupabaseLearningRepository } from "@/data/supabase-learning-repository";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type { Database } from "@/lib/supabase/database.types";

export interface RepositoryFactoryInput {
  supabaseConfigured: boolean;
  demoRequested: boolean;
  storage?: KeyValueStore;
  supabase?: SupabaseClient<Database>;
  accountId?: string;
}

export function createLearningRepository(
  input: RepositoryFactoryInput,
): LearningRepository {
  if (input.supabaseConfigured && !input.demoRequested) {
    if (!input.supabase || !input.accountId) {
      throw new Error("Authenticated Supabase repository context is required.");
    }
    return new SupabaseLearningRepository(input.supabase, input.accountId);
  }
  return new LocalDemoLearningRepository(input.storage);
}
