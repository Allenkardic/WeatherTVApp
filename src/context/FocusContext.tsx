import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type IFocusContextValue = {
  focusedMovieId: string | null;
  setFocusedMovieId: (movieId: string) => void;
};

const FocusContext = createContext<IFocusContextValue | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedMovieId, setFocusedMovieIdState] = useState<string | null>(
    null,
  );

  const setFocusedMovieId = useCallback((movieId: string) => {
    setFocusedMovieIdState(current =>
      current === movieId ? current : movieId,
    );
  }, []);

  const value = useMemo(
    () => ({ focusedMovieId, setFocusedMovieId }),
    [focusedMovieId, setFocusedMovieId],
  );

  return (
    <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
  );
}

export function useFocusSession() {
  const value = useContext(FocusContext);
  if (!value) {
    throw new Error('useFocusSession must be used within FocusProvider');
  }
  return value;
}
