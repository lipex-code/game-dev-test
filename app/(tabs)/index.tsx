import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useAuth } from '@/contexts/auth';
import { bgmAssets } from '../game/audio/audioAssets';
import { playClick } from '../game/audio/useSfx';

export default function Home() {
  const { login, register, user } = useAuth();
  const [fontsLoaded] = useFonts({
    MoreSugar: require('../../assets/fonts/MoreSugar-Regular.ttf'),
  });

  const menuMusicRef = useRef<Audio.Sound | null>(null);

  const [volumeMusica, setVolumeMusica] = useState(60);

  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [loginAberto, setLoginAberto] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);
  const [data, setData] = useState<Date | null>(null);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [avisoOfflineAberto, setAvisoOfflineAberto] = useState(false);
  const [sobreAberto, setSobreAberto] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [cadastroNome, setCadastroNome] = useState('');
  const [cadastroSobrenome, setCadastroSobrenome] = useState('');
  const [cadastroEmail, setCadastroEmail] = useState('');
  const [cadastroSenha, setCadastroSenha] = useState('');
  const [cadastroConfirmarSenha, setCadastroConfirmarSenha] = useState('');
  const [seletorDataAberto, setSeletorDataAberto] = useState(false);
  const [diaNascimento, setDiaNascimento] = useState(1);
  const [mesNascimento, setMesNascimento] = useState(1);
  const [anoNascimento, setAnoNascimento] = useState(2000);
  const [mensagemLogin, setMensagemLogin] = useState('');
  const [mensagemCadastro, setMensagemCadastro] = useState('');

  const isMobile = Platform.OS !== 'web';
  const { width } = useWindowDimensions();

  const BASE_WIDTH = 1920;
  const mobileScale = width / BASE_WIDTH;

  const s = (value: number) => {
    return isMobile ? value * mobileScale : value;
  };

  const brilhoAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const entradaAiko = useRef(new Animated.Value(0)).current;
  const entradaBotoes = useRef(new Animated.Value(0)).current;
  const borboletaAnim = useRef(new Animated.Value(0)).current;
  const lampGlow = useRef(new Animated.Value(0)).current;

  const aikoIdle = useRef(new Animated.Value(0)).current;
  const cenaRespira = useRef(new Animated.Value(0)).current;
  const brilhoLento = useRef(new Animated.Value(0)).current;
  const botaoPulse = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({ length: 20 }).map((_, index) => ({
      y: new Animated.Value(900 + index * 35),
      opacity: new Animated.Value(0),
      size: 3 + (index % 5),
      duration: 7000 + index * 260,
    }))
  ).current;

  const abrirJogo = async (exigirConta = true) => {
  if (menuMusicRef.current) {
    for (let volume = volumeMusica; volume >= 0; volume -= 5) {
      await menuMusicRef.current.setVolumeAsync(volume / 100);
      await new Promise(resolve => setTimeout(resolve, 35));
    }

    await menuMusicRef.current.stopAsync();
    await menuMusicRef.current.unloadAsync();
    menuMusicRef.current = null;
  }

    if (user || !exigirConta) {
    router.replace('/game');
      return;
    }

    setLoginAberto(true);
  };

  const fecharLogin = () => {
    setLoginAberto(false);
    setMensagemLogin('');
  };

  const fecharCadastro = () => {
    setCadastroAberto(false);
    setMensagemCadastro('');
  };

  const handleLogin = async () => {
    setMensagemLogin('');

    try {
      await login({
        email: loginEmail,
        password: loginSenha,
      });
      setLoginSenha('');
      setLoginAberto(false);
      router.replace('/game');
    } catch (error) {
      setMensagemLogin(error instanceof Error ? error.message : 'Não foi possível entrar.');
    }
  };

  const handleCadastro = async () => {
    setMensagemCadastro('');

    try {
      await register({
        firstName: cadastroNome,
        lastName: cadastroSobrenome,
        email: cadastroEmail,
        password: cadastroSenha,
        confirmPassword: cadastroConfirmarSenha,
        birthDate: data,
      });
      setCadastroNome('');
      setCadastroSobrenome('');
      setCadastroEmail('');
      setCadastroSenha('');
      setCadastroConfirmarSenha('');
      setData(null);
      setCadastroAberto(false);
      router.replace('/game');
    } catch (error) {
      setMensagemCadastro(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
    }
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
  if (menuMusicRef.current) {
    menuMusicRef.current.setVolumeAsync(volumeMusica / 100);
  }
}, [volumeMusica]);



  useEffect(() => {
  let ativo = true;

  async function startMenuMusic() {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!ativo) return;

    const { sound } = await Audio.Sound.createAsync(
      bgmAssets.menu,
      {
        isLooping: true,
        volume: volumeMusica / 100,
        shouldPlay: true,
      }
    );

    menuMusicRef.current = sound;
  }

  startMenuMusic();

  return () => {
    ativo = false;

    if (menuMusicRef.current) {
      menuMusicRef.current.unloadAsync();
      menuMusicRef.current = null;
    }
  };
}, []);



  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    Animated.loop(
      Animated.sequence([
        Animated.timing(brilhoAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(brilhoAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(entradaAiko, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entradaBotoes, {
        toValue: 1,
        duration: 1300,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(aikoIdle, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aikoIdle, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cenaRespira, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cenaRespira, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(botaoPulse, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(botaoPulse, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(brilhoLento, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(borboletaAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(borboletaAnim, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(lampGlow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lampGlow, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    particles.forEach((p, index) => {
      const animateParticle = () => {
        p.y.setValue(900 + index * 35);
        p.opacity.setValue(0);

        Animated.sequence([
          Animated.delay(index * 260),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: -120,
              duration: p.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacity, {
                toValue: 0.55,
                duration: 1800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: p.duration - 1800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => animateParticle());
      };

      animateParticle();
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const glow = brilhoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  const lampOpacity = lampGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.78],
  });

  const lampScale = lampGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.18],
  });

  const aikoTranslateY = aikoIdle.interpolate({
    inputRange: [0, 1],
    outputRange: [0, s(-8)],
  });

  const cenaScale = cenaRespira.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });

  const cenaOpacity = cenaRespira.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const botoesScale = entradaBotoes.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  const botoesGlow = botaoPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.75],
  });

  const borboletaTranslateY = borboletaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [s(-8), s(10)],
  });

  const brilhoFaixaX = brilhoLento.interpolate({
    inputRange: [0, 1],
    outputRange: [s(-500), s(2100)],
  });

  const inputStyle = {
    backgroundColor: 'rgba(18, 8, 32, 0.95)',
    color: '#fff',
    padding: isMobile ? 9 : 14,
    borderRadius: 12,
    marginBottom: isMobile ? 8 : 12,
    fontSize: isMobile ? 12 : 14,
    borderWidth: 1,
    borderColor: 'rgba(190, 130, 255, 0.35)',
  };

  const anoAtual = new Date().getFullYear();
  const mesesNascimento = Array.from({ length: 12 }, (_, index) => index + 1);
  const anosNascimento = Array.from({ length: 121 }, (_, index) => anoAtual - index);
  const diasNoMes = new Date(anoNascimento, mesNascimento, 0).getDate();
  const diasNascimento = Array.from({ length: diasNoMes }, (_, index) => index + 1);
  const dataNascimentoTexto = data ? data.toLocaleDateString() : 'Data de nascimento';

  const confirmarDataNascimento = () => {
    setData(new Date(anoNascimento, mesNascimento - 1, diaNascimento));
    setSeletorDataAberto(false);
  };

  const botaoBase = {
    height: s(76),
    borderRadius: 999,
    backgroundColor: 'rgba(150, 95, 190, 0.88)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#d89cff',
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(238, 205, 255, 0.28)',
  };

  const textoBotao = {
    color: '#fff',
    fontSize: s(38),
    letterSpacing: 0.5,
    fontFamily: 'MoreSugar',
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  };

  const BotaoVivo = ({
    children,
    onPress,
    style,
  }: {
    children: any;
    onPress: () => void;
    style: any;
  }) => {
    return (
      <Animated.View
        style={{
          shadowColor: '#d89cff',
          shadowOpacity: botoesGlow,
          shadowRadius: 24,
          elevation: 18,
        }}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={style}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: '32%',
              height: '180%',
              backgroundColor: 'rgba(255,255,255,0.16)',
              transform: [{ translateX: brilhoFaixaX }, { rotate: '-18deg' }],
            }}
          />

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.06)',
              opacity: botoesGlow,
            }}
          />

          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#05000b', overflow: 'hidden' }}>
      <Animated.Image
        source={require('../../assets/background_menu.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: cenaOpacity,
          transform: [{ scale: cenaScale }],
        }}
        resizeMode="cover"
      />


      {particles.map((p, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: s(0),
            top: s(0),
            width: s(p.size),
            height: s(p.size),
            borderRadius: 999,
            backgroundColor: 'rgba(214, 157, 255, 0.9)',
            shadowColor: '#d89cff',
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 8,
            opacity: p.opacity,
            transform: [
              { translateX: s((index * 135) % 1920) },
              { translateY: p.y },
            ],
            zIndex: 2,
          }}
        />
      ))}

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.08)',
          zIndex: 2,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderWidth: s(38),
          borderColor: 'rgba(0,0,0,0.18)',
          zIndex: 3,
        }}
      />

      <Animated.Image
        source={require('../../assets/aiko_menu.png')}
        style={{
          position: 'absolute',
          right: isMobile ? s(700) : s(500),
          bottom: s(-40),
          width: s(700),
          height: s(1020),
          zIndex: 5,
          opacity: entradaAiko,
          transform: [{ translateY: aikoTranslateY }],
        }}
        resizeMode="contain"
      />

      {/* LUZ DA LÂMPADA ESFUMADA */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: s(1255),
          bottom: s(567),
          opacity: lampOpacity,
          zIndex: 6,
          transform: [{ scale: lampScale }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: s(300),
            height: s(300),
            borderRadius: 999,
            backgroundColor: 'rgba(218, 157, 255, 0.035)',
            right: s(-112),
            bottom: s(-112),
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: s(220),
            height: s(220),
            borderRadius: 999,
            backgroundColor: 'rgba(218, 157, 255, 0.055)',
            right: s(-72),
            bottom: s(-72),
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: s(170),
            height: s(170),
            borderRadius: 999,
            backgroundColor: 'rgba(218, 157, 255, 0.075)',
            right: s(-45),
            bottom: s(-45),
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: s(120),
            height: s(120),
            borderRadius: 999,
            backgroundColor: 'rgba(218, 157, 255, 0.11)',
            right: s(-20),
            bottom: s(-20),
          }}
        />

        <View
          style={{
            width: s(70),
            height: s(70),
            borderRadius: 999,
            backgroundColor: 'rgba(245, 220, 255, 0.17)',
            shadowColor: '#e4b1ff',
            shadowOpacity: 1,
            shadowRadius: 70,
            elevation: 30,
          }}
        />
      </Animated.View>

      <TouchableOpacity
        onPress={() => {
          playClick();
          girarEngrenagem();
          setConfigAberta(true);
        }}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          top: s(34),
          right: s(42),
          width: isMobile ? s(90) : s(68),
          height: isMobile ? s(90) : s(68),
          borderRadius: 999,
          backgroundColor: 'rgba(122, 70, 151, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          shadowColor: '#d89cff',
          shadowOpacity: 0.6,
          shadowRadius: 18,
          elevation: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      >
        <Animated.Image
          source={require('../../assets/ui/gear.png')}
          style={{
            width: isMobile ? s(60) : s(40),
            height: isMobile ? s(60) : s(40),
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
<TouchableOpacity
        onPress={() => setSobreAberto(true)}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          top: s(34),
          right: s(160),
          width: isMobile ? s(90) : s(68),
          height: isMobile ? s(90) : s(68),
          borderRadius: 999,
          backgroundColor: 'rgba(122, 70, 151, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          shadowColor: '#d89cff',
          shadowOpacity: 0.6,
          shadowRadius: 18,
          elevation: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: isMobile ? s(46) : s(34),
            fontWeight: 'bold',
            textShadowColor: 'rgba(255,255,255,0.45)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }}
        >
          ?
        </Text>
      </TouchableOpacity>
<View
        style={{
          position: 'absolute',
          left: s(82),
          top: s(42),
          zIndex: 10,
          alignItems: 'center',
        }}
      >
        <View>
          <Image
            source={require('../../assets/logo.png')}
            style={{
              width: isMobile ? s(580) : s(460),
              height: isMobile ? s(350) : s(280),
              marginBottom: isMobile ? s(40) : s(70),
            }}
            resizeMode="contain"
          />

          <Animated.Image
            source={require('../../assets/ui/borboleta.png')}
            style={{
              position: 'absolute',
              right: isMobile ? s(430) : s(450),
              top: isMobile ? s(80) : s(65),
              width: isMobile ? s(180) : s(75),
              height: isMobile ? s(95) : s(75),
              opacity: glow,
              transform: [{ translateY: borboletaTranslateY }],
              zIndex: 15,
            }}
            resizeMode="contain"
          />
        </View>

        <Animated.View
          style={{
            opacity: entradaBotoes,
            alignItems: 'flex-start',
            transform: [{ scale: botoesScale }],
          }}
        >
          <BotaoVivo
            onPress={() => setLoginAberto(true)}
            style={{
              ...botaoBase,
              width: isMobile ? s(440) : s(380),
              marginLeft: s(42),
              marginBottom: s(42),
            }}
          >
            <Text style={textoBotao}>Entrar</Text>
          </BotaoVivo>

          <BotaoVivo
            onPress={() => setCadastroAberto(true)}
            style={{
              ...botaoBase,
              width: isMobile ? s(420) : s(360),
              marginLeft: s(-30),
              marginBottom: s(44),
            }}
          >
            <Text style={textoBotao}>Criar conta</Text>
          </BotaoVivo>

          <BotaoVivo
            onPress={() => setAvisoOfflineAberto(true)}
            style={{
              ...botaoBase,
              width: isMobile ? s(500) : s(450),
              marginLeft: s(36),
              marginTop: s(1),
            }}
          >
            <Text
              style={{
                ...textoBotao,
                fontSize: s(34),
              }}
            >
              Entrar sem conta
            </Text>
          </BotaoVivo>
        </Animated.View>
      </View>

      {/* MODAL AVISO OFFLINE */}
      <Modal visible={avisoOfflineAberto} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: isMobile ? '82%' : 460,
              backgroundColor: 'rgba(18, 5, 35, 0.97)',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: 'rgba(205, 150, 255, 0.75)',
              paddingVertical: isMobile ? 20 : 28,
              paddingHorizontal: isMobile ? 20 : 28,
            }}
          >
            <Text
              style={{
                color: '#f7edff',
                fontSize: isMobile ? 20 : 27,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Progresso não salvo
            </Text>

            <Text
              style={{
                color: '#d9c3ff',
                fontSize: isMobile ? 13 : 16,
                lineHeight: isMobile ? 19 : 24,
                textAlign: 'center',
                marginBottom: 22,
              }}
            >
              Se você continuar sem entrar em uma conta, seu progresso poderá ser
              perdido ao fechar o jogo ou trocar de dispositivo.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setAvisoOfflineAberto(false);
                abrirJogo(false);
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(150, 95, 190, 0.95)',
                paddingVertical: isMobile ? 11 : 14,
                borderRadius: 14,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                CONTINUAR MESMO ASSIM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAvisoOfflineAberto(false);
                setLoginAberto(true);
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                paddingVertical: isMobile ? 10 : 13,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: '#d8c8ff',
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                VOLTAR E FAZER LOGIN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SOBRE */}
      <Modal visible={sobreAberto} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: isMobile ? '82%' : 520,
              backgroundColor: 'rgba(18, 5, 35, 0.97)',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: 'rgba(205, 150, 255, 0.75)',
              paddingVertical: isMobile ? 20 : 28,
              paddingHorizontal: isMobile ? 20 : 30,
              shadowColor: '#d89cff',
              shadowOpacity: 0.55,
              shadowRadius: 24,
              elevation: 18,
            }}
          >
            <Text
              style={{
                color: '#f7edff',
                fontSize: isMobile ? 21 : 28,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 14,
              }}
            >
              Sobre o jogo
            </Text>

            <Text
              style={{
                color: '#d9c3ff',
                fontSize: isMobile ? 13 : 16,
                lineHeight: isMobile ? 20 : 25,
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              Você já teve a sensação de que algo está fora do lugar…
Mesmo quando tudo parece exatamente como deveria?
{'\n'}Aiko Yukimura tem uma rotina normal, como todas as outras.
Vai à escola, segue o mesmo caminho,
volta para casa no fim do dia.
{'\n'}Tudo acontece como sempre aconteceu.
E talvez seja justamente isso…
que torna tudo tão estranho.
Como se algo estivesse errado —
mesmo sem nunca ter mudado.

{'\n'}Last Light Way é uma visual novel de mistério e suspense,
criada como projeto desenvolvido para a disciplina de Mobile.
            </Text>

            <TouchableOpacity
              onPress={() => setSobreAberto(false)}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(150, 95, 190, 0.95)',
                paddingVertical: isMobile ? 11 : 14,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                VOLTAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURAÇÕES */}
      <Modal visible={configAberta} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.72)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: isMobile ? '78%' : 420,
              backgroundColor: 'rgba(18, 5, 35, 0.96)',
              borderRadius: 22,
              padding: isMobile ? 18 : 24,
            }}
          >
            <Text
              style={{
                color: '#f7edff',
                fontSize: isMobile ? 20 : 26,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              Configurações
            </Text>

            <Text
              style={{
                color: '#d8c8ff',
                fontSize: isMobile ? 14 : 16,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Volume Geral
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 18,
                gap: 14,
              }}
            >
              <TouchableOpacity
                onPress={() => setVolumeMusica((v) => Math.max(0, v - 10))}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: '#d9c7ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold' }}>−</Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: '#fff',
                  fontSize: isMobile ? 16 : 18,
                  minWidth: 60,
                  textAlign: 'center',
                }}
              >
                {volumeMusica}%
              </Text>

              <TouchableOpacity
                onPress={() => setVolumeMusica((v) => Math.min(100, v + 10))}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: '#d9c7ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setConfigAberta(false)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                paddingVertical: isMobile ? 10 : 13,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: '#f1e9ff',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Voltar ao menu principal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL LOGIN */}
      <Modal visible={loginAberto} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <View
            style={{
              width: isMobile ? '72%' : '100%',
              maxWidth: 430,
              backgroundColor: 'rgba(18, 8, 32, 0.97)',
              borderRadius: 22,
              padding: isMobile ? 16 : 24,
            }}
          >
            <Text
              style={{
                color: '#f2e9ff',
                fontSize: isMobile ? 20 : 27,
                fontWeight: 'bold',
                marginBottom: isMobile ? 12 : 18,
                textAlign: 'center',
              }}
            >
              ENTRAR
            </Text>

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setLoginEmail}
              placeholder="E-mail"
              placeholderTextColor="#aaa"
              style={inputStyle}
              value={loginEmail}
            />

            <TextInput
              onChangeText={setLoginSenha}
              placeholder="Senha"
              placeholderTextColor="#aaa"
              secureTextEntry
              style={inputStyle}
              value={loginSenha}
            />

            {!!mensagemLogin && (
              <Text
                style={{
                  color: '#ffd4e1',
                  fontSize: isMobile ? 11 : 13,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {mensagemLogin}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              style={{
                backgroundColor: '#965fbe',
                padding: isMobile ? 10 : 14,
                borderRadius: 12,
                marginTop: 4,
              }}
            >
              <Text style={{ textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>
                ENTRAR NO JOGO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={fecharLogin}>
              <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CADASTRO */}
      <Modal visible={cadastroAberto} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? 10 : 24,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: isMobile ? 430 : '100%',
                maxWidth: 430,
                backgroundColor: 'rgba(18, 8, 32, 0.97)',
                borderRadius: 22,
                padding: isMobile ? 14 : 24,
              }}
            >
              <Text
                style={{
                  color: '#f2e9ff',
                  fontSize: isMobile ? 20 : 27,
                  fontWeight: 'bold',
                  marginBottom: isMobile ? 10 : 18,
                  textAlign: 'center',
                }}
              >
                CRIAR CONTA
              </Text>

              <TextInput
                onChangeText={setCadastroNome}
                placeholder="Nome"
                placeholderTextColor="#aaa"
                style={inputStyle}
                value={cadastroNome}
              />
              <TextInput
                onChangeText={setCadastroSobrenome}
                placeholder="Sobrenome"
                placeholderTextColor="#aaa"
                style={inputStyle}
                value={cadastroSobrenome}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setCadastroEmail}
                placeholder="E-mail"
                placeholderTextColor="#aaa"
                style={inputStyle}
                value={cadastroEmail}
              />

              <TextInput
                onChangeText={setCadastroSenha}
                placeholder="Senha"
                placeholderTextColor="#aaa"
                secureTextEntry
                style={inputStyle}
                value={cadastroSenha}
              />

              <TextInput
                onChangeText={setCadastroConfirmarSenha}
                placeholder="Confirmar senha"
                placeholderTextColor="#aaa"
                secureTextEntry
                style={inputStyle}
                value={cadastroConfirmarSenha}
              />

              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    setSeletorDataAberto(true);
                    return;
                  }

                  setMostrarPicker(true);
                }}
                style={inputStyle}
              >
                <Text style={{ color: '#aaa' }}>{dataNascimentoTexto}</Text>
              </TouchableOpacity>

              {mostrarPicker && (
                <DateTimePicker
                  value={data ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setMostrarPicker(false);
                    if (selectedDate) setData(selectedDate);
                  }}
                />
              )}

              {!!mensagemCadastro && (
                <Text
                  style={{
                    color: '#ffd4e1',
                    fontSize: isMobile ? 11 : 13,
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  {mensagemCadastro}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleCadastro}
                style={{
                  backgroundColor: '#965fbe',
                  padding: isMobile ? 10 : 14,
                  borderRadius: 12,
                  marginTop: 4,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>
                  CONFIRMAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={fecharCadastro}>
                <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* SELETOR DE DATA DE NASCIMENTO WEB */}
      <Modal visible={seletorDataAberto} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.78)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 430,
              backgroundColor: 'rgba(18, 8, 32, 0.98)',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(190, 130, 255, 0.65)',
              padding: 20,
            }}
          >
            <Text
              style={{
                color: '#f2e9ff',
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Data de nascimento
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#d8c8ff', textAlign: 'center', marginBottom: 8 }}>
                  Dia
                </Text>
                <ScrollView style={{ maxHeight: 210 }}>
                  {diasNascimento.map((dia) => (
                    <TouchableOpacity
                      key={dia}
                      onPress={() => setDiaNascimento(dia)}
                      style={{
                        paddingVertical: 9,
                        borderRadius: 10,
                        marginBottom: 6,
                        backgroundColor:
                          dia === diaNascimento ? '#965fbe' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                        {String(dia).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#d8c8ff', textAlign: 'center', marginBottom: 8 }}>
                  Mês
                </Text>
                <ScrollView style={{ maxHeight: 210 }}>
                  {mesesNascimento.map((mes) => (
                    <TouchableOpacity
                      key={mes}
                      onPress={() => {
                        setMesNascimento(mes);
                        setDiaNascimento((dia) =>
                          Math.min(dia, new Date(anoNascimento, mes, 0).getDate()),
                        );
                      }}
                      style={{
                        paddingVertical: 9,
                        borderRadius: 10,
                        marginBottom: 6,
                        backgroundColor:
                          mes === mesNascimento ? '#965fbe' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                        {String(mes).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flex: 1.2 }}>
                <Text style={{ color: '#d8c8ff', textAlign: 'center', marginBottom: 8 }}>
                  Ano
                </Text>
                <ScrollView style={{ maxHeight: 210 }}>
                  {anosNascimento.map((ano) => (
                    <TouchableOpacity
                      key={ano}
                      onPress={() => {
                        setAnoNascimento(ano);
                        setDiaNascimento((dia) =>
                          Math.min(dia, new Date(ano, mesNascimento, 0).getDate()),
                        );
                      }}
                      style={{
                        paddingVertical: 9,
                        borderRadius: 10,
                        marginBottom: 6,
                        backgroundColor:
                          ano === anoNascimento ? '#965fbe' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                        {ano}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              onPress={confirmarDataNascimento}
              style={{
                backgroundColor: '#965fbe',
                paddingVertical: 13,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                CONFIRMAR DATA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSeletorDataAberto(false)}>
              <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 6 }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
