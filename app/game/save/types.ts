import type { CenaKey } from '../data/cenas';
import type { CorBala } from '../data/types';

export type SaveCharacterState = {
  id: string;
  sprite: string;
  position: string;
  expression?: string;
  isSpeaking?: boolean;
};

export type SaveCheckpointType =
  | 'act_start'
  | 'act_complete'
  | 'chapter_start'
  | 'before_choice'
  | 'after_choice'
  | 'before_critical_scene'
  | 'after_critical_scene'
  | 'manual'
  | 'scene';

export type VisualNovelSceneState = {
  currentAct: number;
  currentChapter: number;
  currentScene: CenaKey;
  dialogueIndex: number;
  speakerName: string;
  dialogueText: string;
  currentBackground: string;
  characters: SaveCharacterState[];
  currentMusic: string | null;
  currentAmbience: string | null;
  currentSfx: string | null;
  choices: Record<string, unknown>;
  flags: Record<string, unknown>;
  events: Record<string, boolean>;
  variables: Record<string, unknown>;
  unlockedItems: string[];
  unlockedGallery: string[];
  unlockedCgs: string[];
  candyChoice: CorBala | null;
};

export type GameSave = VisualNovelSceneState & {
  userId: string;
  completedActs: number[];
  unlockedActs: number[];
  isFinished: boolean;
  lastCheckpoint: SaveCheckpointType;
  lastSave: string;
  version: number;
};

export type SaveProgressInput = Partial<VisualNovelSceneState> & {
  checkpoint?: SaveCheckpointType;
  completedAct?: number;
};

export type SaveChoiceInput = {
  choiceId: string;
  value?: unknown;
  nextScene?: string;
};
