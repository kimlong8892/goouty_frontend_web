
import { Project } from '@/lib/types.ts';

export interface ProjectWithStage extends Project {
  stage?: 'planning' | 'inProgress' | 'review' | 'completed';
  reviewCount?: number;
  reviewScore?: number;
}

export type ProjectStage = 'planning' | 'inProgress' | 'review' | 'completed';
