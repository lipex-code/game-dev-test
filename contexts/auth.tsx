import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { Profile, SupabaseSession } from '@/services/supabase';
import { supabaseService } from '@/services/supabase';
import { createSave } from '@/app/game/save/saveSystem';

type AuthUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: Date | null;
};

type LoginData = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: SupabaseSession | null;
  isLoading: boolean;
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRequired = (value: string, message: string) => {
  if (!value.trim()) {
    throw new Error(message);
  }
};

const validateEmail = (email: string) => {
  if (!emailRegex.test(email)) {
    throw new Error('Informe um e-mail válido.');
  }
};

const validateBirthDate = (birthDate: Date | null) => {
  if (!birthDate) {
    throw new Error('Informe sua data de nascimento.');
  }

  if (birthDate > new Date()) {
    throw new Error('A data de nascimento não pode estar no futuro.');
  }
};

const getAuthUser = (session: SupabaseSession, profile: Profile | null): AuthUser => ({
  id: session.user.id,
  email: session.user.email ?? profile?.email ?? '',
  profile,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const restoredSession = await supabaseService.restoreSession();

        if (!isMounted || !restoredSession) {
          return;
        }

        const profile = await supabaseService.getProfile(
          restoredSession.user.id,
          restoredSession.access_token,
        );

        if (isMounted) {
          setSession(restoredSession);
          setUser(getAuthUser(restoredSession, profile));
        }
      } catch (error) {
        await supabaseService.signOut();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const register = async (data: RegisterData) => {
    validateRequired(data.firstName, 'Informe seu nome.');
    validateRequired(data.lastName, 'Informe seu sobrenome.');
    validateRequired(data.email, 'Informe seu e-mail.');
    validateRequired(data.password, 'Informe sua senha.');
    validateRequired(data.confirmPassword, 'Confirme sua senha.');

    const email = normalizeEmail(data.email);
    validateEmail(email);

    if (data.password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('A senha e a confirmação precisam ser iguais.');
    }

    validateBirthDate(data.birthDate);
    const birthDate = data.birthDate;

    if (!birthDate) {
      throw new Error('Informe sua data de nascimento.');
    }

    const result = await supabaseService.signUp({
      email,
      password: data.password,
      nome: data.firstName.trim(),
      sobrenome: data.lastName.trim(),
      dataNascimento: birthDate,
    });

    if (!result.session) {
      throw new Error(
        'Conta criada. Confirme seu e-mail antes de entrar, se a confirmação estiver ativa no Supabase.',
      );
    }

    setSession(result.session);
    setUser(getAuthUser(result.session, result.profile));
    await createSave(result.session.user.id);
  };

  const login = async (data: LoginData) => {
    validateRequired(data.email, 'Informe seu e-mail.');
    validateRequired(data.password, 'Informe sua senha.');

    const email = normalizeEmail(data.email);
    validateEmail(email);

    const result = await supabaseService.signIn({
      email,
      password: data.password,
    });

    setSession(result.session);
    setUser(getAuthUser(result.session, result.profile));
    await createSave(result.session.user.id);
  };

  const logout = async () => {
    await supabaseService.signOut(session?.access_token);
    setSession(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      register,
      login,
      logout,
    }),
    [user, session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
