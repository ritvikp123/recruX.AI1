import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useJobStore } from "../store/useJobStore";

interface AuthContextValue {
  user: any;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Call after signIn/signUp so UI updates before navigation */
  setSessionFromAuth: (session: { user: any } | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleSessionData = (sessionObj: { user: any } | null) => {
    if (sessionObj?.user) {
      void useJobStore.getState().hydrateUserJobs(sessionObj.user.id);
      void useJobStore.getState().loadResumeFromSupabase(sessionObj.user.id);
    } else {
      useJobStore.getState().clearUserData();
    }
  };

  useEffect(() => {
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
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        handleSessionData(session);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
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
    <AuthContext.Provider value={{ user, session, loading, signOut, setSessionFromAuth }}>
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

