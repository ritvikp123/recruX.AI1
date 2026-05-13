import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useJobStore } from "../store/useJobStore";
import { urlIndicatesPasswordRecovery } from "../lib/authRecovery";

const PW_RECOVERY_STORAGE_KEY = "recrux_pw_recovery_pending";

interface AuthContextValue {
  user: any;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Call after signIn/signUp so UI updates before navigation */
  setSessionFromAuth: (session: { user: any } | null) => void;
  /** True after recovery link is used until user finishes reset or clears (see clearPasswordRecoveryPending). */
  passwordRecoveryPending: boolean;
  clearPasswordRecoveryPending: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(PW_RECOVERY_STORAGE_KEY) === "1") return true;
    if (urlIndicatesPasswordRecovery()) {
      sessionStorage.setItem(PW_RECOVERY_STORAGE_KEY, "1");
      return true;
    }
    return false;
  });

  const handleSessionData = (sessionObj: { user: any } | null) => {
    if (sessionObj?.user) {
      void useJobStore.getState().hydrateUserJobs(sessionObj.user.id);
      void useJobStore.getState().loadResumeFromSupabase(sessionObj.user.id);
    } else {
      useJobStore.getState().clearUserData();
    }
  };

  const clearPasswordRecoveryPending = useCallback(() => {
    setPasswordRecoveryPending(false);
    sessionStorage.removeItem(PW_RECOVERY_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && urlIndicatesPasswordRecovery()) {
      sessionStorage.setItem(PW_RECOVERY_STORAGE_KEY, "1");
      setPasswordRecoveryPending(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      handleSessionData(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryPending(true);
        sessionStorage.setItem(PW_RECOVERY_STORAGE_KEY, "1");
      }
      if (event === "SIGNED_OUT") {
        clearPasswordRecoveryPending();
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "PASSWORD_RECOVERY") {
        handleSessionData(session);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearPasswordRecoveryPending]);

  const signOut = async () => {
    clearPasswordRecoveryPending();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    handleSessionData(null);
  };

  const setSessionFromAuth = (newSession: { user: any } | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    handleSessionData(newSession);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        setSessionFromAuth,
        passwordRecoveryPending,
        clearPasswordRecoveryPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

