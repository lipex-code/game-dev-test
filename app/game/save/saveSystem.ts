import { supabaseService } from '@/services/supabase';
import { cenas } from '../data/cenas';
import type { Dialogo } from '../data/types';
import {
  FIRST_SCENE,
  SAVE_VERSION,
  getActFromScene,
  getChapterFromScene,
  getCompletedActsForScene,
  getFirstSceneForAct,
  getUnlockedActs,
} from './metadata';
import type { GameSave, SaveChoiceInput, SaveProgressInput, VisualNovelSceneState } from './types';

type SaveRow = {
  user_id: string;
  current_act: number;
  current_chapter: number;
  current_scene: string;
  dialogue_index: number;
  completed_acts: number[];
  unlocked_acts: number[];
  is_finished: boolean;
  save_data: GameSave;
  updated_at: string;
  created_at?: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const assertSupabaseConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY para usar o Supabase.',
    );
  }
};

const getHeaders = (accessToken: string): Record<string, string> => {
  assertSupabaseConfig();

  return {
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? data?.msg ?? data?.error_description;
    throw new Error(message || 'Nao foi possivel salvar o progresso.');
  }

  return data as T;
};

const validateUserSession = async (userId: string) => {
  if (!userId) {
    throw new Error('Usuario invalido para salvar progresso.');
  }

  const session = await supabaseService.getStoredSession();

  if (!session || session.user.id !== userId) {
    throw new Error('Voce so pode acessar o save da propria conta.');
  }

  // Confirma a existencia do usuario antes de permitir qualquer gravacao.
  const profile = await supabaseService.getProfile(userId, session.access_token);

  if (!profile) {
    throw new Error('Usuario autenticado nao encontrado.');
  }

  return session;
};

const nowIso = () => new Date().toISOString();

const createInitialSave = (userId: string): GameSave => {
  const scene = cenas[FIRST_SCENE];
  const firstDialogue = scene.dialogos[0] as Dialogo;
  const currentAct = getActFromScene(FIRST_SCENE);

  return {
    userId,
    currentAct,
    currentChapter: getChapterFromScene(FIRST_SCENE),
    currentScene: FIRST_SCENE,
    dialogueIndex: 0,
    speakerName: firstDialogue?.nome ?? '',
    dialogueText: firstDialogue?.texto ?? '',
    currentBackground: FIRST_SCENE,
    characters: [],
    currentMusic: firstDialogue?.bgm ?? null,
    currentAmbience: firstDialogue?.ambience ?? null,
    currentSfx: firstDialogue?.sfx ?? null,
    choices: {},
    flags: {},
    events: { [`entered_${FIRST_SCENE}`]: true },
    variables: {},
    unlockedItems: [],
    unlockedGallery: [],
    unlockedCgs: [],
    candyChoice: null,
    completedActs: [],
    unlockedActs: [1],
    isFinished: false,
    lastCheckpoint: 'act_start',
    lastSave: nowIso(),
    version: SAVE_VERSION,
  };
};

const normalizeSave = (userId: string, save: GameSave): GameSave => {
  // Se o JSON estiver em outra versao, apontar para uma cena inexistente ou vier corrompido,
  // o jogo volta para um estado inicial consistente em vez de quebrar a tela.
  if (save.version !== SAVE_VERSION || !(save.currentScene in cenas)) {
    return createInitialSave(userId);
  }

  const scene = cenas[save.currentScene];
  const dialogueIndex = Math.min(Math.max(save.dialogueIndex ?? 0, 0), scene.dialogos.length - 1);
  const currentAct = getActFromScene(save.currentScene);
  const completedActs = Array.from(
    new Set([...(save.completedActs ?? []), ...getCompletedActsForScene(save.currentScene)]),
  ).filter((act) => act >= 1 && act <= 3);

  return {
    ...createInitialSave(userId),
    ...save,
    userId,
    currentAct,
    currentChapter: getChapterFromScene(save.currentScene),
    dialogueIndex,
    completedActs,
    unlockedActs: getUnlockedActs(completedActs, save.isFinished),
    lastSave: save.lastSave || nowIso(),
    version: SAVE_VERSION,
  };
};

const toRowPayload = (save: GameSave) => ({
  user_id: save.userId,
  current_act: save.currentAct,
  current_chapter: save.currentChapter,
  current_scene: save.currentScene,
  dialogue_index: save.dialogueIndex,
  completed_acts: save.completedActs,
  unlocked_acts: save.unlockedActs,
  is_finished: save.isFinished,
  save_data: save,
  updated_at: save.lastSave,
});

const mapRowToSave = (row: SaveRow): GameSave => {
  const saveData = row.save_data;

  if (!saveData || saveData.userId !== row.user_id) {
    throw new Error('Save invalido ou corrompido.');
  }

  return normalizeSave(row.user_id, {
    ...saveData,
    currentAct: row.current_act,
    currentChapter: row.current_chapter,
    currentScene: row.current_scene as GameSave['currentScene'],
    dialogueIndex: row.dialogue_index,
    completedActs: row.completed_acts ?? [],
    unlockedActs: row.unlocked_acts ?? [1],
    isFinished: row.is_finished,
    lastSave: row.updated_at,
  });
};

const requestSaveRows = async (userId: string, accessToken: string) => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${userId}&select=*`,
    {
      method: 'GET',
      headers: getHeaders(accessToken),
    },
  );

  return parseResponse<SaveRow[]>(response);
};

const upsertSave = async (save: GameSave, accessToken: string) => {
  // O upsert do Supabase usa a chave primaria user_id, evitando saves duplicados por conta.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...getHeaders(accessToken),
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(toRowPayload(save)),
  });

  const rows = await parseResponse<SaveRow[]>(response);
  return mapRowToSave(rows[0]);
};

export async function createSave(userId: string) {
  const session = await validateUserSession(userId);
  const existingSave = await getCurrentProgress(userId);

  if (existingSave) {
    return existingSave;
  }

  return upsertSave(createInitialSave(userId), session.access_token);
}

export async function loadSave(userId: string) {
  const session = await validateUserSession(userId);
  const rows = await requestSaveRows(userId, session.access_token);

  if (!rows[0]) {
    return createSave(userId);
  }

  return mapRowToSave(rows[0]);
}

export async function saveProgress(userId: string, progress: SaveProgressInput = {}) {
  const session = await validateUserSession(userId);
  const currentSave = await loadSave(userId);
  const currentScene = progress.currentScene ?? currentSave.currentScene;
  const currentAct = progress.currentAct ?? getActFromScene(currentScene);
  const completedActs = new Set(currentSave.completedActs);
  const completedAct = progress.completedAct;

  if (completedAct) {
    completedActs.add(completedAct);
  }

  if (currentAct > 1) completedActs.add(1);
  if (currentAct > 2) completedActs.add(2);

  const isFinished = Boolean(currentSave.isFinished || completedAct === 3);

  const nextSave = normalizeSave(userId, {
    ...currentSave,
    ...progress,
    userId,
    currentAct,
    currentChapter: progress.currentChapter ?? getChapterFromScene(currentScene),
    currentScene,
    dialogueIndex: progress.dialogueIndex ?? currentSave.dialogueIndex,
    choices: { ...currentSave.choices, ...(progress.choices ?? {}) },
    flags: { ...currentSave.flags, ...(progress.flags ?? {}) },
    events: { ...currentSave.events, ...(progress.events ?? {}) },
    variables: { ...currentSave.variables, ...(progress.variables ?? {}) },
    unlockedItems: Array.from(new Set([...currentSave.unlockedItems, ...(progress.unlockedItems ?? [])])),
    unlockedGallery: Array.from(new Set([...currentSave.unlockedGallery, ...(progress.unlockedGallery ?? [])])),
    unlockedCgs: Array.from(new Set([...currentSave.unlockedCgs, ...(progress.unlockedCgs ?? [])])),
    completedActs: Array.from(completedActs).sort((a, b) => a - b),
    unlockedActs: getUnlockedActs(Array.from(completedActs), isFinished),
    isFinished,
    lastCheckpoint: progress.checkpoint ?? currentSave.lastCheckpoint,
    lastSave: nowIso(),
  } as GameSave);

  return upsertSave(nextSave, session.access_token);
}

export async function saveSceneState(userId: string, sceneState: VisualNovelSceneState) {
  return saveProgress(userId, {
    ...sceneState,
    checkpoint: 'scene',
  });
}

export async function loadSceneState(userId: string) {
  return loadSave(userId);
}

export async function saveChoice(userId: string, choice: string | SaveChoiceInput) {
  const input = typeof choice === 'string' ? { choiceId: choice, value: true } : choice;
  const safeChoiceId = input.choiceId.trim();

  if (!safeChoiceId) {
    throw new Error('Escolha invalida.');
  }

  return saveProgress(userId, {
    checkpoint: 'after_choice',
    choices: {
      [safeChoiceId]: input.value ?? true,
    },
    flags: input.nextScene
      ? {
          [`route_${input.nextScene}`]: true,
        }
      : undefined,
  });
}

export async function getCurrentProgress(userId: string) {
  const session = await validateUserSession(userId);
  const rows = await requestSaveRows(userId, session.access_token);

  return rows[0] ? mapRowToSave(rows[0]) : null;
}

export async function unlockNextAct(userId: string) {
  const currentSave = await loadSave(userId);
  const completedAct = currentSave.currentAct;
  const nextAct = Math.min(completedAct + 1, 3);

  return saveProgress(userId, {
    currentAct: nextAct,
    currentChapter: 1,
    currentScene: getFirstSceneForAct(nextAct),
    dialogueIndex: 0,
    completedAct,
    checkpoint: completedAct >= 3 ? 'act_complete' : 'act_start',
  });
}

export async function resetProgress(userId: string) {
  const session = await validateUserSession(userId);
  return upsertSave(createInitialSave(userId), session.access_token);
}
