import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useGameAudio } from './audio/useGameAudio';
import type { SpriteKey } from './data/sprites';
import { sprites } from './data/sprites';

import { useAuth } from '@/contexts/auth';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CandyChoices } from './components/CandyChoices';
import { DialogueBox } from './components/DialogueBox';
import { NarrativeChoices } from './components/NarrativeChoices';
import { SettingsModal } from './components/SettingsModal';
import { SpriteRenderer } from './components/SpriteRenderer';
import type { CenaKey, CorBala } from './data/cenas';
import { cenas } from './data/cenas';
import type { Dialogo, EscolhaNarrativa } from './data/types';
import {
  ACT_START_SCENES,
  CRITICAL_SCENES,
  getActFromScene,
  getChapterFromScene,
} from './save/metadata';
import {
  loadSceneState,
  saveChoice,
  saveProgress,
  saveSceneState,
} from './save/saveSystem';
import type { SaveCharacterState, SaveCheckpointType, VisualNovelSceneState } from './save/types';
import { gameStyles } from './styles/gameStyles';


const { width } = Dimensions.get('window');


export default function Game() {
  const { logout, user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const fadeCena = useRef(new Animated.Value(0)).current;
  const spriteFade = useRef(new Animated.Value(0)).current;
  const spriteAnterior = useRef<string | null>(null);
  const flashLimboOpacity = useRef(new Animated.Value(0)).current;

  const meioOlhoAnim = useRef(new Animated.Value(0)).current;
  const olhoFechadoAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isMobile = Platform.OS !== 'web';

  const [cenaAtual, setCenaAtual] = useState<CenaKey>('cena1');
  const [dialogoIndex, setDialogoIndex] = useState(0);
  const [textoVisivel, setTextoVisivel] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);
  const [volumeMusica, setVolumeMusica] = useState(60);
  const [saveCarregado, setSaveCarregado] = useState(false);
  const [currentBgm, setCurrentBgm] = useState<string | null | undefined>(undefined);
  const [currentAmbience, setCurrentAmbience] = useState<string | null | undefined>(undefined);
  const saveInicialAplicadoRef = useRef(false);
  const salvandoAutomaticoRef = useRef(false);


  const [mostrarFlashLimbo, setMostrarFlashLimbo] = useState(false);
  const [assetsCarregados, setAssetsCarregados] = useState(false);

  const [momentoEscolhaBalinhas, setMomentoEscolhaBalinhas] = useState(false);
  const [mostrarOpcoesBalinhas, setMostrarOpcoesBalinhas] = useState(false);
  const [corEscolhida, setCorEscolhida] = useState<CorBala | null>(null);

  const [mostrarFinalAct1, setMostrarFinalAct1] = useState(false);
  const [mostrarMensagemFinalAct1, setMostrarMensagemFinalAct1] = useState(false);
  const [frameFinal, setFrameFinal] = useState(0);

  const fadeFinalAct1 = useRef(new Animated.Value(0)).current;
  const finalAct2Opacity = useRef(new Animated.Value(0)).current;

  const [mostrarTituloAto, setMostrarTituloAto] = useState(false);
  const [tituloAto, setTituloAto] = useState('');
  const tituloAtoOpacity = useRef(new Animated.Value(0)).current;

  const mostrarTelaAto = (titulo: string) => {
    setTituloAto(titulo);
    setMostrarTituloAto(true);

    tituloAtoOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(tituloAtoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(tituloAtoOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMostrarTituloAto(false);
    });
  };


  const cena9TransicaoOpacity = useRef(new Animated.Value(1)).current;
  const cena9Zoom = useRef(new Animated.Value(1)).current;
  const cena9BackgroundAtualRef = useRef<any>(null);
  const ultimoBackgroundRef = useRef<any>(null);
  const cena9ZoomAtivoRef = useRef(false);
  const [cena9BackgroundAtual, setCena9BackgroundAtual] = useState<any>(null);
  const [cena9BackgroundAnterior, setCena9BackgroundAnterior] = useState<any>(null);
  const [cena9ZoomAtivo, setCena9ZoomAtivo] = useState(false);

  const cena = cenas[cenaAtual];
  const dialogos = cena.dialogos;
  const dialogoAtual = dialogos[dialogoIndex] as Dialogo;

  const getResolvedBackgroundState = (sceneKey: CenaKey, targetDialogueIndex: number) => {
    const scene = cenas[sceneKey];
    const safeIndex = Math.min(
      Math.max(targetDialogueIndex, 0),
      Math.max(scene.dialogos.length - 1, 0),
    );
    let background = scene.background;
    let zoomAtivo = false;

    for (let index = 0; index <= safeIndex; index++) {
      const dialogue = scene.dialogos[index] as Dialogo;

      if (dialogue.background) {
        background = dialogue.background;
        zoomAtivo = false;
      }

      if (sceneKey === 'cena9' && dialogue.texto.includes('minhas colegas')) {
        background = require('../../assets/backgrounds/ato2/ato2cena2.png');
        zoomAtivo = false;
      }

      if (sceneKey === 'cena9' && dialogue.texto.includes('Rin e Misuki olham')) {
        background = require('../../assets/backgrounds/ato2/ato2cena3.png');
        zoomAtivo = false;
      }

      if (sceneKey === 'cena9' && dialogue.texto.includes('carteira')) {
        background = require('../../assets/backgrounds/ato2/ato2cena4.png');
        zoomAtivo = true;
      }

      if (sceneKey === 'cena9' && dialogue.texto.includes('janela')) {
        background = require('../../assets/backgrounds/ato2/ato2cena5.png');
        zoomAtivo = false;
      }

      if (sceneKey === 'cena9' && dialogue.nome === 'Aiko' && dialogue.texto === 'O que tem ela?') {
        background = require('../../assets/backgrounds/ato2/ato2cena3.png');
        zoomAtivo = false;
      }
    }

    return { background, zoomAtivo };
  };

  useGameAudio(
    cenaAtual,
    volumeMusica,
    currentAmbience,
    currentBgm,
    dialogoAtual?.sfx ?? null,
  );

  const spriteMobileBottom = -230;
  const amigaMobileBottom = -230;

  const efeitoSpriteWeb =
    cenaAtual === 'cena6'
      ? 'brightness(1) contrast(0.96) saturate(1.08) sepia(0.05)'
      : cenaAtual === 'cena8'
        ? 'brightness(0.85) contrast(0.95)'
        : cenaAtual === 'cena4'
          ? 'brightness(0.88)'
          : cenaAtual === 'cena5'
            ? 'brightness(0.9)'
            : 'brightness(0.92)';

  const sombraSpriteMobile =
    cenaAtual === 'cena6'
      ? 0.04
      : cenaAtual === 'cena8'
        ? 0.13
        : cenaAtual === 'cena4'
          ? 0.11
          : cenaAtual === 'cena5'
            ? 0.1
            : 0.08;

  const textoDialogoAtual =
    dialogoAtual.falaCorEscolhida
      ? dialogoAtual.texto.includes('[COR]')
        ? dialogoAtual.texto.replace(
            '[COR]',
            corEscolhida ? corEscolhida.toLowerCase() : 'rosas',
          )
        : `Hmm… as ${corEscolhida ? corEscolhida.toLowerCase() : 'rosas'}.`
      : dialogoAtual.texto;

  const spritesMantidos =
    'manterSprites' in dialogoAtual && dialogoAtual.manterSprites
      ? (dialogoAtual.manterSprites as readonly SpriteKey[])
      : [];

  const spritePrincipalKey =
    'sprite' in dialogoAtual && dialogoAtual.sprite
      ? (dialogoAtual.sprite as SpriteKey)
      : spritesMantidos.length === 1
        ? spritesMantidos[0]
        : null;

  const spriteAtual = spritePrincipalKey ? sprites[spritePrincipalKey] : null;

  const cenasExcluidasAmigas = [
    'cena31',
    'cena60',
  ];

  const mostrarAmigas =
    (
      dialogoAtual.nome === 'Rin' ||
      dialogoAtual.nome === 'Misuki' ||
      (
        spritesMantidos.some((sprite) => sprite.startsWith('rin_')) &&
        spritesMantidos.some((sprite) => sprite.startsWith('misuki_'))
      )
    ) &&
    !cenasExcluidasAmigas.includes(cenaAtual);

  const rinSpriteKey =
    dialogoAtual.nome === 'Rin' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('rin_')) || 'rin_normal';

  const misukiSpriteKey =
    dialogoAtual.nome === 'Misuki' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('misuki_')) || 'misuki_normal';

  const rinFalando = dialogoAtual.nome === 'Rin';
  const misukiFalando = dialogoAtual.nome === 'Misuki';

  const mostrarTrioGuardachuva =
    cenaAtual === 'cena60' &&
    spritesMantidos.some((sprite) => sprite.startsWith('aiko_')) &&
    spritesMantidos.some((sprite) => sprite.startsWith('rin_')) &&
    spritesMantidos.some((sprite) => sprite.startsWith('misuki_'));

  const mostrarAikoRin =
    spritesMantidos.some((sprite) => sprite.startsWith('aiko_')) &&
    spritesMantidos.some((sprite) => sprite.startsWith('rin_'));

  const aikoTrioGuardachuvaSpriteKey =
    spritesMantidos.find((sprite) => sprite.startsWith('aiko_')) || 'aiko_seriaguardachuva';

  const rinTrioGuardachuvaSpriteKey =
    spritesMantidos.find((sprite) => sprite.startsWith('rin_')) || 'rin_seriaguardachuva';

  const misukiTrioGuardachuvaSpriteKey =
    spritesMantidos.find((sprite) => sprite.startsWith('misuki_')) || 'misuki_rindoguardachuva';

  const aikoDuplaSpriteKey =
    dialogoAtual.nome === 'Aiko' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('aiko_')) || 'aiko_timida';

  const rinDuplaSpriteKey =
    dialogoAtual.nome === 'Rin' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('rin_')) || 'rin_medo';

  const aikoFalando = dialogoAtual.nome === 'Aiko';
  const rinDuplaFalando = dialogoAtual.nome === 'Rin';

  const mostrarGarotosSupervisora =
    cenaAtual === 'cena31' &&
    spritesMantidos.some((sprite) => sprite.startsWith('sota_')) &&
    spritesMantidos.some((sprite) => sprite.startsWith('tsubasa_')) &&
    spritesMantidos.some((sprite) => sprite.startsWith('supervisora_'));

  const mostrarGarotos =
    !mostrarGarotosSupervisora &&
    (
      dialogoAtual.nome === 'Tsubasa' ||
      dialogoAtual.nome === 'Sota' ||
      spritesMantidos.some((sprite) => sprite.startsWith('tsubasa_')) ||
      spritesMantidos.some((sprite) => sprite.startsWith('sota_'))
    );

  const sotaSpriteKey =
    dialogoAtual.nome === 'Sota' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('sota_')) || 'sota_serio';

  const tsubasaSpriteKey =
    dialogoAtual.nome === 'Tsubasa' && spritePrincipalKey
      ? spritePrincipalKey
      : spritesMantidos.find((sprite) => sprite.startsWith('tsubasa_')) || 'tsubasa_serio';

  const supervisoraSpriteKey =
    spritesMantidos.find((sprite) => sprite.startsWith('supervisora_')) || 'supervisora_irritada';

  const sotaFalando = dialogoAtual.nome === 'Sota';
  const tsubasaFalando = dialogoAtual.nome === 'Tsubasa';
  const supervisoraFalando = dialogoAtual.nome === 'Supervisora';

  const spriteKeyAtual = mostrarTrioGuardachuva
    ? `${aikoTrioGuardachuvaSpriteKey}-${rinTrioGuardachuvaSpriteKey}-${misukiTrioGuardachuvaSpriteKey}`
    : mostrarAmigas
      ? `${rinSpriteKey}-${misukiSpriteKey}`
      : mostrarAikoRin
        ? `${aikoDuplaSpriteKey}-${rinDuplaSpriteKey}`
        : mostrarGarotosSupervisora
        ? `${sotaSpriteKey}-${supervisoraSpriteKey}-${tsubasaSpriteKey}`
        : mostrarGarotos
          ? `${sotaSpriteKey}-${tsubasaSpriteKey}`
          : spritePrincipalKey;

  const fonteNome = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia',
  });

  const escolhasNarrativas: EscolhaNarrativa[] = Array.isArray(dialogoAtual.escolhas)
    ? dialogoAtual.escolhas
    : [];

  const momentoEscolhaNarrativa = escolhasNarrativas.length > 0;

  const getSpriteExpression = (spriteKey: string) => spriteKey.split('_').slice(1).join('_') || spriteKey;

  const createCharacterState = (
    spriteKey: string,
    position: string,
    isSpeaking = false,
  ): SaveCharacterState => ({
    id: spriteKey.split('_')[0],
    sprite: spriteKey,
    position,
    expression: getSpriteExpression(spriteKey),
    isSpeaking,
  });

  const personagensVisiveis: SaveCharacterState[] = mostrarTrioGuardachuva
    ? [
        createCharacterState(aikoTrioGuardachuvaSpriteKey, 'left', dialogoAtual.nome === 'Aiko'),
        createCharacterState(rinTrioGuardachuvaSpriteKey, 'center', dialogoAtual.nome === 'Rin'),
        createCharacterState(misukiTrioGuardachuvaSpriteKey, 'right', dialogoAtual.nome === 'Misuki'),
      ]
    : mostrarAmigas
      ? [
          createCharacterState(rinSpriteKey, 'left', rinFalando),
          createCharacterState(misukiSpriteKey, 'right', misukiFalando),
        ]
      : mostrarAikoRin
        ? [
            createCharacterState(rinDuplaSpriteKey, 'left', rinDuplaFalando),
            createCharacterState(aikoDuplaSpriteKey, 'right', aikoFalando),
          ]
        : mostrarGarotosSupervisora
          ? [
              createCharacterState(sotaSpriteKey, 'left', sotaFalando),
              createCharacterState(supervisoraSpriteKey, 'center', supervisoraFalando),
              createCharacterState(tsubasaSpriteKey, 'right', tsubasaFalando),
            ]
          : mostrarGarotos
            ? [
                createCharacterState(sotaSpriteKey, 'left', sotaFalando),
                createCharacterState(tsubasaSpriteKey, 'right', tsubasaFalando),
              ]
            : spritePrincipalKey
              ? [createCharacterState(spritePrincipalKey, 'center', true)]
              : [];

  const getCurrentBackgroundKey = () => {
    if (momentoEscolhaBalinhas) {
      return 'choices/balinhas1choice';
    }

    if (dialogoAtual.background) {
      return `${cenaAtual}:${dialogoIndex}:dialogue_background`;
    }

    if (cenaAtual === 'cena9') {
      return `${cenaAtual}:${dialogoIndex}:derived_background`;
    }

    return cenaAtual;
  };

  const criarEstadoCena = (
    overrides: Partial<VisualNovelSceneState> = {},
  ): VisualNovelSceneState => {
    const cenaSnapshot = overrides.currentScene ?? cenaAtual;
    const indiceSnapshot = overrides.dialogueIndex ?? dialogoIndex;
    const dialogoSnapshot = (cenas[cenaSnapshot].dialogos[indiceSnapshot] ?? dialogoAtual) as Dialogo;
    const textoSnapshot =
      cenaSnapshot === cenaAtual && indiceSnapshot === dialogoIndex
        ? textoDialogoAtual
        : dialogoSnapshot.texto;

    return {
      currentAct: getActFromScene(cenaSnapshot),
      currentChapter: getChapterFromScene(cenaSnapshot),
      currentScene: cenaSnapshot,
      dialogueIndex: indiceSnapshot,
      speakerName: dialogoSnapshot.nome ?? '',
      dialogueText: textoSnapshot,
      currentBackground:
        cenaSnapshot === cenaAtual && indiceSnapshot === dialogoIndex
          ? getCurrentBackgroundKey()
          : cenaSnapshot,
      characters:
        cenaSnapshot === cenaAtual && indiceSnapshot === dialogoIndex ? personagensVisiveis : [],
      currentMusic: (dialogoSnapshot.bgm ?? currentBgm ?? null) as string | null,
      currentAmbience: (dialogoSnapshot.ambience ?? currentAmbience ?? null) as string | null,
      currentSfx: dialogoSnapshot.sfx ?? null,
      choices: corEscolhida ? { candy_color: corEscolhida } : {},
      flags: corEscolhida ? { [`candy_${corEscolhida.toLowerCase()}`]: true } : {},
      events: {
        [`entered_${cenaSnapshot}`]: true,
      },
      variables: {
        candy_color: corEscolhida,
      },
      unlockedItems: [],
      unlockedGallery: [],
      unlockedCgs: [],
      candyChoice: corEscolhida,
      ...overrides,
    };
  };

  const girarEngrenagem = () => {
    rotateAnim.setValue(0);

    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (dialogoAtual.bgm !== undefined) {
      setCurrentBgm(dialogoAtual.bgm);
    }

    if (dialogoAtual.ambience !== undefined) {
      setCurrentAmbience(dialogoAtual.ambience);
    }
  }, [cenaAtual, dialogoIndex, dialogoAtual.bgm, dialogoAtual.ambience]);

  useEffect(() => {
    if (!user?.id || !saveCarregado || !saveInicialAplicadoRef.current) return;

    let cancelado = false;

    const timer = setTimeout(async () => {
      if (cancelado || salvandoAutomaticoRef.current) return;

      const checkpoint: SaveCheckpointType = momentoEscolhaNarrativa
        ? 'before_choice'
        : dialogoIndex === 0 && ACT_START_SCENES.has(cenaAtual)
          ? 'act_start'
          : dialogoIndex === 0
            ? 'chapter_start'
            : CRITICAL_SCENES.has(cenaAtual)
              ? 'before_critical_scene'
              : 'scene';

      try {
        salvandoAutomaticoRef.current = true;
        await saveProgress(user.id, {
          ...criarEstadoCena(),
          checkpoint,
        });
      } catch (error) {
        console.warn('Falha no salvamento automatico:', error);
      } finally {
        salvandoAutomaticoRef.current = false;
      }
    }, 450);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [
    user?.id,
    saveCarregado,
    cenaAtual,
    dialogoIndex,
    textoDialogoAtual,
    corEscolhida,
    currentBgm,
    currentAmbience,
    momentoEscolhaNarrativa,
  ]);

  useEffect(() => {
    let componenteAtivo = true;

    const adicionarAsset = (lista: any[], asset: any) => {
      if (asset && lista.indexOf(asset) === -1) {
        lista.push(asset);
      }
    };

    const carregarImagem = async (asset: any) => {
      try {
        const resolvido = Image.resolveAssetSource(asset);

        if (resolvido?.uri) {
          await Image.prefetch(resolvido.uri);
        }
      } catch (error) {
        // Se algum asset falhar no pré-carregamento, o jogo continua normalmente.
      }
    };

    const carregarAssets = async () => {
      try {
        const listaAssets: any[] = [];

        Object.keys(sprites).forEach((spriteKey) => {
          adicionarAsset(listaAssets, (sprites as any)[spriteKey]);
        });

        Object.keys(cenas).forEach((cenaKey) => {
          const cenaLista = (cenas as any)[cenaKey];

          adicionarAsset(listaAssets, cenaLista?.background);

          if (Array.isArray(cenaLista?.dialogos)) {
            cenaLista.dialogos.forEach((dialogo: any) => {
              adicionarAsset(listaAssets, dialogo?.background);
            });
          }
        });

        [
          require('../../assets/choices/balinhas1choice.png'),
          require('../../assets/ui/gear.png'),
          require('../../assets/backgrounds/ato1/olhos_meio_abertos.png'),
          require('../../assets/backgrounds/ato1/olhos_fechados.png'),
          require('../../assets/backgrounds/ato1/finalact1.png'),
          require('../../assets/backgrounds/ato1/finalact2.png'),
          require('../../assets/backgrounds/ato2/ato2cena2.png'),
          require('../../assets/backgrounds/ato2/ato2cena3.png'),
          require('../../assets/backgrounds/ato2/ato2cena4.png'),
          require('../../assets/backgrounds/ato2/ato2cena5.png'),
          require('../../assets/backgrounds/ato3/aikodead.png'),
          require('../../assets/backgrounds/ato3/aikodead2.png'),
        ].forEach((asset) => adicionarAsset(listaAssets, asset));

        await Promise.all(listaAssets.map(carregarImagem));
      } catch (error) {
        console.log('Erro ao pré-carregar imagens:', error);
      } finally {
        if (componenteAtivo) {
          setAssetsCarregados(true);
        }
      }
    };

    carregarAssets();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    const restaurarSave = async () => {
      if (!user?.id) {
        setSaveCarregado(true);
        return;
      }

      try {
        const save = await loadSceneState(user.id);

        if (!ativo) return;

        const cenaSalva = save.currentScene in cenas ? save.currentScene : 'cena1';
        const dialogosCena = cenas[cenaSalva].dialogos;
        const indiceSalvo = Math.min(
          Math.max(save.dialogueIndex ?? 0, 0),
          Math.max(dialogosCena.length - 1, 0),
        );

        setCenaAtual(cenaSalva);
        setDialogoIndex(indiceSalvo);
        setCorEscolhida(save.candyChoice);
        setCurrentBgm(save.currentMusic);
        setCurrentAmbience(save.currentAmbience);
        const backgroundSalvo = getResolvedBackgroundState(cenaSalva, indiceSalvo);
        cena9BackgroundAtualRef.current = backgroundSalvo.background;
        ultimoBackgroundRef.current = backgroundSalvo.background;
        cena9ZoomAtivoRef.current = backgroundSalvo.zoomAtivo;
        setCena9BackgroundAtual(backgroundSalvo.background);
        setCena9BackgroundAnterior(null);
        setCena9ZoomAtivo(backgroundSalvo.zoomAtivo);
        cena9TransicaoOpacity.setValue(1);
        cena9Zoom.setValue(backgroundSalvo.zoomAtivo ? 1.08 : 1);
        fadeAnim.setValue(cenaSalva === 'cena1' && indiceSalvo === 0 ? 1 : 0);
      } catch (error) {
        console.warn('Nao foi possivel carregar o save:', error);
        fadeAnim.setValue(1);
      } finally {
        if (ativo) {
          saveInicialAplicadoRef.current = true;
          setSaveCarregado(true);
        }
      }
    };

    restaurarSave();

    return () => {
      ativo = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!assetsCarregados || !saveCarregado) return;
    if (!(cenaAtual === 'cena1' && dialogoIndex === 0)) return;

    mostrarTelaAto('ATO I');

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 2600,
      useNativeDriver: true,
    }).start();

    olhoFechadoAnim.setValue(1);
    meioOlhoAnim.setValue(0);

    Animated.sequence([
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(meioOlhoAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(olhoFechadoAnim, {
          toValue: 0.3,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(meioOlhoAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(olhoFechadoAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [assetsCarregados, saveCarregado]);

  useEffect(() => {
    if (!assetsCarregados) return;

    let index = 0;
    let textoCompleto = textoDialogoAtual;

    setTextoVisivel('');
    setDigitando(true);

    const intervalo = setInterval(() => {
      setTextoVisivel(textoCompleto.slice(0, index + 1));
      index++;

      if (index >= textoCompleto.length) {
        clearInterval(intervalo);
        setDigitando(false);
      }
    }, 35);

    return () => clearInterval(intervalo);
  }, [dialogoIndex, cenaAtual, textoDialogoAtual, assetsCarregados]);

  useEffect(() => {
    if (dialogoIndex === 0) {
      cena9BackgroundAtualRef.current = cena.background;
      cena9ZoomAtivoRef.current = false;
      setCena9BackgroundAtual(cena.background);
      setCena9BackgroundAnterior(null);
      setCena9ZoomAtivo(false);
      cena9TransicaoOpacity.setValue(1);
      cena9Zoom.setValue(1);
    }

    let novoBackground: any = null;
    let ativarZoom = false;

    if (dialogoAtual.background) {
      novoBackground = dialogoAtual.background;
    }

    if (cenaAtual === 'cena9' && dialogoAtual.texto === '*Olho para minhas colegas e as vejo conversando escondido da professora.*') {
      novoBackground = require('../../assets/backgrounds/ato2/ato2cena2.png');
    }

    if (cenaAtual === 'cena9' && dialogoAtual.texto === '*Rin e Misuki olham para mim instantaneamente.*') {
      novoBackground = require('../../assets/backgrounds/ato2/ato2cena3.png');
    }

    if (cenaAtual === 'cena9' && dialogoAtual.texto === '*Meu olhar vai direto pra carteira…*') {
      novoBackground = require('../../assets/backgrounds/ato2/ato2cena4.png');
      ativarZoom = true;
    }

    if (cenaAtual === 'cena9' && dialogoAtual.texto === '*Olho para a janela…*') {
      novoBackground = require('../../assets/backgrounds/ato2/ato2cena5.png');
    }

    if (cenaAtual === 'cena9' && dialogoAtual.nome === 'Aiko' && dialogoAtual.texto === 'O que tem ela?') {
      novoBackground = require('../../assets/backgrounds/ato2/ato2cena3.png');
    }

    if (!novoBackground) return;

    const backgroundAnterior = cena9BackgroundAtualRef.current || cena.background;

    // Se o background for o mesmo, não faz fade.
    if (backgroundAnterior === novoBackground) {
      cena9BackgroundAtualRef.current = novoBackground;
      setCena9BackgroundAtual(novoBackground);
      setCena9BackgroundAnterior(null);
      cena9TransicaoOpacity.setValue(1);
      cena9ZoomAtivoRef.current = ativarZoom;
      setCena9ZoomAtivo(ativarZoom);
      return;
    }

    setCena9BackgroundAnterior(backgroundAnterior);
    cena9BackgroundAtualRef.current = novoBackground;
    setCena9BackgroundAtual(novoBackground);

    cena9ZoomAtivoRef.current = ativarZoom;
    setCena9ZoomAtivo(ativarZoom);

    cena9TransicaoOpacity.setValue(0);
    cena9Zoom.setValue(1);

    Animated.timing(cena9TransicaoOpacity, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    if (ativarZoom) {
      Animated.timing(cena9Zoom, {
        toValue: 1.08,
        duration: 1400,
        useNativeDriver: true,
      }).start();
    }
  }, [cenaAtual, dialogoIndex]);

  useEffect(() => {
    if (!spriteKeyAtual) {
      spriteAnterior.current = null;
      spriteFade.setValue(0);
      return;
    }

    if (spriteAnterior.current !== spriteKeyAtual) {
      spriteFade.setValue(0);

      Animated.timing(spriteFade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      spriteAnterior.current = spriteKeyAtual;
    } else {
      spriteFade.setValue(1);
    }
  }, [spriteKeyAtual]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (
      cenaAtual === 'cena6' &&
      'escolhaBalinhas' in dialogoAtual &&
      dialogoAtual.escolhaBalinhas &&
      !corEscolhida
    ) {
      setMomentoEscolhaBalinhas(true);
      setMostrarOpcoesBalinhas(false);

      timer = setTimeout(() => {
        setMostrarOpcoesBalinhas(true);
      }, 2000);
    } else {
      setMomentoEscolhaBalinhas(false);
      setMostrarOpcoesBalinhas(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [dialogoIndex, cenaAtual]);

  useEffect(() => {
    if (!mostrarFinalAct1) return;

    fadeFinalAct1.setValue(0);
    finalAct2Opacity.setValue(0);
    setFrameFinal(0);
    setMostrarMensagemFinalAct1(false);

    let timerMostrarFinalAct2: ReturnType<typeof setTimeout> | null = null;
    let timerEsconderFinalAct2: ReturnType<typeof setTimeout> | null = null;
    let timerMensagem: ReturnType<typeof setTimeout> | null = null;

    // 1) Tela preta por 2 segundos.
    const timerTelaPreta = setTimeout(() => {
      // 2) Aparece finalact1.png.
      Animated.timing(fadeFinalAct1, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // 3) finalact2.png aparece POR CIMA de finalact1.
        timerMostrarFinalAct2 = setTimeout(() => {
          Animated.timing(finalAct2Opacity, {
            toValue: 1,
            duration: 25,
            useNativeDriver: true,
          }).start();
        }, 280);

        // 4) finalact2.png some, voltando para finalact1.
        timerEsconderFinalAct2 = setTimeout(() => {
          Animated.timing(finalAct2Opacity, {
            toValue: 0,
            duration: 25,
            useNativeDriver: true,
          }).start();
        }, 390);

        // 5) Depois da falha, aparece o texto.
        timerMensagem = setTimeout(() => {
          setMostrarMensagemFinalAct1(true);
        }, 1100);
      });
    }, 2000);

    return () => {
      clearTimeout(timerTelaPreta);

      if (timerMostrarFinalAct2) clearTimeout(timerMostrarFinalAct2);
      if (timerEsconderFinalAct2) clearTimeout(timerEsconderFinalAct2);
      if (timerMensagem) clearTimeout(timerMensagem);
    };
  }, [mostrarFinalAct1, finalAct2Opacity, fadeFinalAct1]);

  const trocarCena = () => {
    let proximaCena = cena.proxima as string | null | undefined;

    // Segurança extra: se algum arquivo antigo ainda apontar para "ato3",
    // o jogo entra corretamente na primeira cena do ato 3.
    if (proximaCena === 'ato3') {
      proximaCena = 'cena49';
    }

    if (!proximaCena) {
      if (user?.id) {
        void saveProgress(user.id, {
          ...criarEstadoCena(),
          completedAct: 3,
          checkpoint: 'act_complete',
        });
      }

      Animated.timing(fadeCena, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/');
      });

      return;
    }

    if (!(proximaCena in cenas)) {
      console.warn('Cena seguinte não encontrada:', proximaCena);
      return;
    }

    const cenaDestino = cenas[proximaCena as CenaKey] as any;
    const backgroundAtual = (dialogoAtual as any).background || cena.background;
    const proximoBackground = (cenaDestino.dialogos?.[0] as any)?.background || cenaDestino.background;
    const deveMostrarTituloAto = proximaCena === 'cena9' || proximaCena === 'cena49';
    const tituloDoAto = proximaCena === 'cena9' ? 'ATO II' : proximaCena === 'cena49' ? 'ATO III' : '';
    const deveFazerFade = backgroundAtual !== proximoBackground || deveMostrarTituloAto;
    const duracaoFade = cenaAtual === 'cena19' && proximaCena === 'cena20' ? 1600 : 350;
    const atoConcluido = proximaCena === 'cena9' ? 1 : proximaCena === 'cena49' ? 2 : undefined;

    if (user?.id && atoConcluido) {
      void saveProgress(user.id, {
        ...criarEstadoCena({
          currentScene: proximaCena as CenaKey,
          dialogueIndex: 0,
        }),
        completedAct: atoConcluido,
        checkpoint: 'act_complete',
      });
    }

    const mudarCena = () => {
      setCenaAtual(proximaCena as CenaKey);
      setDialogoIndex(0);
      setTextoVisivel('');
      setDigitando(false);
      spriteAnterior.current = null;
      cena9BackgroundAtualRef.current = proximoBackground;
      ultimoBackgroundRef.current = proximoBackground;
      setCena9BackgroundAtual(proximoBackground);
      setCena9BackgroundAnterior(null);
      cena9TransicaoOpacity.setValue(1);
      cena9Zoom.setValue(1);

      if (deveMostrarTituloAto) {
        mostrarTelaAto(tituloDoAto);
      }
    };

    if (!deveFazerFade) {
      mudarCena();
      fadeCena.setValue(0);
      return;
    }

    Animated.timing(fadeCena, {
      toValue: 1,
      duration: duracaoFade,
      useNativeDriver: true,
    }).start(() => {
      mudarCena();

      Animated.timing(fadeCena, {
        toValue: 0,
        duration: duracaoFade,
        useNativeDriver: true,
      }).start();
    });
  };

  const escolherBalinha = (cor: CorBala) => {
    if (user?.id) {
      void saveChoice(user.id, {
        choiceId: 'cena6_balinhas',
        value: cor,
      });

      void saveProgress(user.id, {
        ...criarEstadoCena({
          dialogueIndex: dialogoIndex + 1,
          candyChoice: cor,
          choices: { candy_color: cor },
          flags: { [`candy_${cor.toLowerCase()}`]: true },
          variables: { candy_color: cor },
        }),
        checkpoint: 'after_choice',
      });
    }

    setCorEscolhida(cor);
    setMomentoEscolhaBalinhas(false);
    setMostrarOpcoesBalinhas(false);
    spriteAnterior.current = null;
    setDialogoIndex((indexAtual) => indexAtual + 1);
  };

  const escolherOpcaoNarrativa = (proximaCena: string) => {
    const cenaDestino = proximaCena === 'ato3' ? 'cena49' : proximaCena;

    if (!cenaDestino || !(cenaDestino in cenas)) {
      console.warn('Cena de escolha não encontrada:', cenaDestino);
      return;
    }

    const destino = cenas[cenaDestino as CenaKey] as any;
    const backgroundAtual = (dialogoAtual as any).background || cena.background;
    const proximoBackground = (destino.dialogos?.[0] as any)?.background || destino.background;
    const deveMostrarTituloAto = cenaDestino === 'cena9' || cenaDestino === 'cena49';
    const tituloDoAto = cenaDestino === 'cena9' ? 'ATO II' : cenaDestino === 'cena49' ? 'ATO III' : '';
    const deveFazerFade = backgroundAtual !== proximoBackground || deveMostrarTituloAto;
    const choiceId = `${cenaAtual}_${dialogoIndex}_${cenaDestino}`;

    if (user?.id) {
      void saveChoice(user.id, {
        choiceId,
        value: true,
        nextScene: cenaDestino,
      });

      void saveProgress(user.id, {
        ...criarEstadoCena({
          currentScene: cenaDestino as CenaKey,
          dialogueIndex: 0,
          choices: { [choiceId]: true },
          flags: { [`route_${cenaDestino}`]: true },
        }),
        checkpoint: 'after_choice',
      });
    }

    const mudarCena = () => {
      setCenaAtual(cenaDestino as CenaKey);
      setDialogoIndex(0);
      setTextoVisivel('');
      setDigitando(false);
      spriteAnterior.current = null;
      cena9BackgroundAtualRef.current = proximoBackground;
      ultimoBackgroundRef.current = proximoBackground;
      setCena9BackgroundAtual(proximoBackground);
      setCena9BackgroundAnterior(null);
      cena9TransicaoOpacity.setValue(1);
      cena9Zoom.setValue(1);

      if (deveMostrarTituloAto) {
        mostrarTelaAto(tituloDoAto);
      }
    };

    if (!deveFazerFade) {
      mudarCena();
      fadeCena.setValue(0);
      return;
    }

    Animated.timing(fadeCena, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      mudarCena();

      Animated.timing(fadeCena, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePress = () => {
    if (configAberta) return;
    if (momentoEscolhaBalinhas) return;
    if (mostrarFlashLimbo) return;

    if (
      cenaAtual === 'final_limbo_escola' &&
      (
        textoDialogoAtual === '*Chego na escola, e me sento na minha cadeira, como sempre.*' ||
        textoDialogoAtual === '*O barulho da aula parece distante… como se não fosse comigo.*'
      ) &&
      !digitando
    ) {
      setMostrarFlashLimbo(true);
      flashLimboOpacity.setValue(0);

      Animated.sequence([
        Animated.timing(flashLimboOpacity, {
          toValue: 1,
          duration: 35,
          useNativeDriver: true,
        }),
        Animated.delay(130),
        Animated.timing(flashLimboOpacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMostrarFlashLimbo(false);
        setDialogoIndex((indexAtual) => indexAtual + 1);
      });

      return;
    }

    if (momentoEscolhaNarrativa) {
      if (digitando) {
        setTextoVisivel(textoDialogoAtual);
        setDigitando(false);
      }
      return;
    }

    if (mostrarFinalAct1) {
      if (mostrarMensagemFinalAct1) {
        Animated.timing(fadeCena, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          setMostrarFinalAct1(false);
          setMostrarMensagemFinalAct1(false);
          trocarCena();
        });
      }
      return;
    }

    if (digitando) {
      setTextoVisivel(textoDialogoAtual);
      setDigitando(false);
      return;
    }

    if (dialogoIndex < dialogos.length - 1) {
      setDialogoIndex(dialogoIndex + 1);
    } else {
      if (cenaAtual === 'cena8') {
        setMostrarFinalAct1(true);
      } else {
        trocarCena();
      }
    }
  };

  const diminuirVolume = () => {
    setVolumeMusica((valor) => Math.max(0, valor - 10));
  };

  const aumentarVolume = () => {
    setVolumeMusica((valor) => Math.min(100, valor + 10));
  };

  const salvarJogo = async () => {
    if (!user?.id) return;

    try {
      await saveSceneState(user.id, criarEstadoCena());
      setConfigAberta(false);
    } catch (error) {
      console.warn('Nao foi possivel salvar manualmente:', error);
    }
  };

  const voltarMenu = async () => {
    await logout();
    router.replace('/');
  };

  if (!assetsCarregados || !saveCarregado) {
    return (
      <View
        style={[
          gameStyles.tela,
          {
            backgroundColor: '#000',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text
          style={{
            color: '#f7f3ff',
            fontSize: isMobile ? 18 : 22,
            fontFamily: fonteNome,
            letterSpacing: 1.5,
          }}
        >
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={gameStyles.tela}
    >
      {!momentoEscolhaBalinhas ? (
        <>
          <Animated.Image
            source={cena9BackgroundAnterior || cena9BackgroundAtual || cena.background}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: [{ scale: cena9Zoom }],
            }}
            resizeMode="cover"
          />

          <Animated.Image
            source={cena9BackgroundAtual || cena.background}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: cena9TransicaoOpacity,
              transform: [{ scale: cena9Zoom }],
            }}
            resizeMode="cover"
          />
        </>
      ) : (
        <Image
          source={
            momentoEscolhaBalinhas
              ? require('../../assets/choices/balinhas1choice.png')
              : cena.background
          }
          style={gameStyles.background}
          resizeMode="cover"
        />
      )}

      {cenaAtual === 'cena1' && (
        <>
          <Animated.Image
            source={require('../../assets/backgrounds/ato1/olhos_meio_abertos.png')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: meioOlhoAnim,
              zIndex: 1,
            }}
            resizeMode="cover"
          />

          <Animated.Image
            source={require('../../assets/backgrounds/ato1/olhos_fechados.png')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: olhoFechadoAnim,
              zIndex: 2,
            }}
            resizeMode="cover"
          />
        </>
      )}

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.32)',
          zIndex: 3,
        }}
      />

      {!momentoEscolhaBalinhas && !mostrarFinalAct1 && cenaAtual !== 'cena9' && (
        mostrarAmigas ? (
          <>
            <SpriteRenderer
              source={sprites[rinSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                left: isMobile ? '24%' : '28%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: rinFalando ? 7 : 6,
                transform: [{ scale: rinFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />

            <SpriteRenderer
              source={sprites[misukiSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                right: isMobile ? '24%' : '28%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: misukiFalando ? 7 : 6,
                transform: [{ scale: misukiFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />
          </>
        ) : mostrarAikoRin ? (
          <>
            <SpriteRenderer
              source={sprites[rinDuplaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                left: isMobile ? '23%' : '27%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: rinDuplaFalando ? 7 : 6,
                transform: [{ scale: rinDuplaFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />

            <SpriteRenderer
              source={sprites[aikoDuplaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                right: isMobile ? '23%' : '27%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: aikoFalando ? 7 : 6,
                transform: [{ scale: aikoFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />
          </>
        ) : mostrarGarotosSupervisora ? (
          <>
            <SpriteRenderer
              source={sprites[supervisoraSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                left: isMobile ? '34%' : '38%',
                width: isMobile ? 300 : 520,
                height: isMobile ? 760 : 860,
                zIndex: supervisoraFalando ? 6 : 5,
                transform: [{ scale: supervisoraFalando ? 1.02 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.26,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />

            <SpriteRenderer
              source={sprites[sotaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                left: isMobile ? '18%' : '23%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: sotaFalando ? 8 : 7,
                transform: [{ scale: sotaFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />

            <SpriteRenderer
              source={sprites[tsubasaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                right: isMobile ? '19%' : '24%',
                width: isMobile ? 310 : 530,
                height: isMobile ? 760 : 860,
                zIndex: tsubasaFalando ? 8 : 7,
                transform: [{ scale: tsubasaFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />
          </>
        ) : mostrarGarotos ? (
          <>
            <SpriteRenderer
              source={sprites[sotaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                left: isMobile ? '23%' : '27%',
                width: isMobile ? 290 : 500,
                height: isMobile ? 740 : 830,
                zIndex: sotaFalando ? 7 : 6,
                transform: [{ scale: sotaFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />

            <SpriteRenderer
              source={sprites[tsubasaSpriteKey as SpriteKey]}
              containerStyle={{
                position: 'absolute',
                bottom: isMobile ? amigaMobileBottom : -120,
                right: isMobile ? '23%' : '27%',
                width: isMobile ? 310 : 530,
                height: isMobile ? 760 : 860,
                zIndex: tsubasaFalando ? 7 : 6,
                transform: [{ scale: tsubasaFalando ? 1.05 : 0.96 }],
              }}
              imageStyle={{
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 10 },
              }}
              spriteFade={spriteFade}
              efeitoSpriteWeb={efeitoSpriteWeb}
              sombraSpriteMobile={sombraSpriteMobile}
            />
          </>
        ) : (
          spriteAtual &&
          <SpriteRenderer
            source={spriteAtual}
            containerStyle={{
              position: 'absolute',
              bottom: isMobile ? spriteMobileBottom : -120,
              left: '50%',
              transform: [{ translateX: -((isMobile ? 310 : 560) / 2) }],
              width: isMobile ? 310 : 560,
              height: isMobile ? 760 : 860,
              zIndex: 6,
            }}
            imageStyle={{
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 12 },
            }}
            spriteFade={spriteFade}
            efeitoSpriteWeb={efeitoSpriteWeb}
            sombraSpriteMobile={sombraSpriteMobile}
          />
        )
      )}

      {!mostrarFinalAct1 && (
        <TouchableOpacity
          onPress={() => {
            girarEngrenagem();
            setConfigAberta(true);
          }}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            top: isMobile ? 18 : 28,
            right: isMobile ? 24 : 36,
            width: isMobile ? 44 : 68,
            height: isMobile ? 44 : 68,
            borderRadius: 999,
            backgroundColor: 'rgba(18, 5, 35, 0.75)',
            borderWidth: 1,
            borderColor: 'rgba(190, 130, 255, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <Animated.Image
            source={require('../../assets/ui/gear.png')}
            style={{
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '120deg'],
                  }),
                },
              ],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {momentoEscolhaBalinhas && mostrarOpcoesBalinhas && (
        <CandyChoices onChoose={escolherBalinha} />
      )}

      {!momentoEscolhaBalinhas && !mostrarFinalAct1 && momentoEscolhaNarrativa && !digitando && (
        <NarrativeChoices
          escolhas={escolhasNarrativas}
          isMobile={isMobile}
          onChoose={escolherOpcaoNarrativa}
        />
      )}

      {!momentoEscolhaBalinhas && !mostrarFinalAct1 && (
        <DialogueBox
          nome={dialogoAtual.nome}
          texto={textoVisivel}
          digitando={digitando}
          isMobile={isMobile}
          fonteNome={fonteNome}
        />
      )}

      {mostrarFinalAct1 && (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              zIndex: 998,
            }}
          />

          <Animated.Image
            source={require('../../assets/backgrounds/ato1/finalact1.png')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 999,
              opacity: fadeFinalAct1,
            }}
            resizeMode="contain"
          />

          <Animated.Image
            source={require('../../assets/backgrounds/ato1/finalact2.png')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 1000,
              opacity: finalAct2Opacity,
            }}
            resizeMode="contain"
          />

          {mostrarMensagemFinalAct1 && (
            <View
              style={{
                position: 'absolute',
                bottom: 28,
                width: '100%',
                alignItems: 'center',
                paddingHorizontal: 18,
                zIndex: 1001,
              }}
            >
              <View
                style={{
                  width: Math.min(width * 0.88, 900),
                  minHeight: 92,
                  backgroundColor: 'rgba(18, 5, 35, 0.62)',
                  borderRadius: 22,
                  borderWidth: 1.3,
                  borderColor: 'rgba(190, 130, 255, 0.65)',
                  paddingHorizontal: 24,
                  paddingTop: 28,
                  paddingBottom: 18,
                  shadowColor: '#9b4dff',
                  shadowOpacity: 0.6,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 12,
                }}
              >
                <Text
                  style={{
                    color: '#f8f2ff',
                    fontSize: 18,
                    lineHeight: 27,
                    letterSpacing: 0.3,
                  }}
                >
                  Amanhã será um novo dia.
                </Text>

                <Text
                  style={{
                    position: 'absolute',
                    right: 18,
                    bottom: 8,
                    color: '#caaaff',
                    fontSize: 14,
                    opacity: 0.8,
                  }}
                >
                  ▶
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {mostrarFlashLimbo && (
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: flashLimboOpacity,
            zIndex: 1500,
          }}
        >
          <Image
            source={
              textoDialogoAtual === '*O barulho da aula parece distante… como se não fosse comigo.*'
                ? require('../../assets/backgrounds/ato3/aikodead2.png')
                : require('../../assets/backgrounds/ato3/aikodead.png')
            }
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />
        </Animated.View>
      )}

      <SettingsModal
        visible={configAberta}
        isMobile={isMobile}
        volumeMusica={volumeMusica}
        onClose={() => setConfigAberta(false)}
        diminuirVolume={diminuirVolume}
        aumentarVolume={aumentarVolume}
        salvarJogo={salvarJogo}
        voltarMenu={voltarMenu}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity: fadeAnim,
          zIndex: 30,
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity: fadeCena,
          zIndex: 2000,
        }}
      />

      {mostrarTituloAto && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: tituloAtoOpacity,
            zIndex: 3000,
            elevation: 3000,
          }}
        >
          <Text
            style={{
              color: '#f7f3ff',
              fontSize: isMobile ? 42 : 64,
              fontFamily: fonteNome,
              letterSpacing: 4,
            }}
          >
            {tituloAto}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
