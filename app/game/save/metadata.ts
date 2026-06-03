import type { CenaKey } from '../data/cenas';

export const SAVE_VERSION = 1;
export const FIRST_SCENE: CenaKey = 'cena1';

type ActDefinition = {
  act: number;
  firstScene: CenaKey;
  startsAt: number;
  endsAt: number;
};

export const ACT_DEFINITIONS: ActDefinition[] = [
  { act: 1, firstScene: 'cena1', startsAt: 1, endsAt: 8 },
  { act: 2, firstScene: 'cena9', startsAt: 9, endsAt: 48 },
  { act: 3, firstScene: 'cena49', startsAt: 49, endsAt: 69 },
];

export const ACT_START_SCENES = new Set<CenaKey>(['cena1', 'cena9', 'cena49']);

export const CRITICAL_SCENES = new Set<CenaKey>([
  'cena8',
  'cena48',
  'cena48_final',
  'cena69',
  'final_limbo',
  'final_limbo_escola',
  'final_acordar',
  'final_acordar_hospital',
  'final_acordar_escola',
]);

export function getSceneNumber(scene: string) {
  const match = scene.match(/^cena(\d+)/);
  return match ? Number(match[1]) : null;
}

export function getActFromScene(scene: string) {
  const sceneNumber = getSceneNumber(scene);

  if (!sceneNumber) {
    return 3;
  }

  return ACT_DEFINITIONS.find(
    (definition) => sceneNumber >= definition.startsAt && sceneNumber <= definition.endsAt,
  )?.act ?? 1;
}

export function getChapterFromScene(scene: string) {
  const act = getActFromScene(scene);
  const sceneNumber = getSceneNumber(scene);
  const definition = ACT_DEFINITIONS.find((item) => item.act === act);

  if (!sceneNumber || !definition) {
    return 1;
  }

  return Math.max(1, Math.floor((sceneNumber - definition.startsAt) / 4) + 1);
}

export function getFirstSceneForAct(act: number) {
  return ACT_DEFINITIONS.find((definition) => definition.act === act)?.firstScene ?? FIRST_SCENE;
}

export function getCompletedActsForScene(scene: string) {
  const act = getActFromScene(scene);

  if (act <= 1) return [];
  if (act === 2) return [1];
  return [1, 2];
}

export function getUnlockedActs(completedActs: number[], isFinished = false) {
  const unlocked = new Set<number>([1]);

  if (completedActs.includes(1)) unlocked.add(2);
  if (completedActs.includes(2)) unlocked.add(3);
  if (isFinished) unlocked.add(3);

  return Array.from(unlocked).sort((a, b) => a - b);
}
