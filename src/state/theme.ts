import { Theme } from 'shiki';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type ThemeType = {
    previousTheme: Theme;
    setPreviousTheme: (theme: Theme) => void;
};
export const useThemeStore = create<ThemeType>()(
    persist(
        devtools(
            (set) => ({
                previousTheme: 'nord',
                setPreviousTheme(theme: Theme) {
                    set({ previousTheme: theme });
                },
            }),
            { name: 'Code Block Pro Theme' },
        ),
        {
            name: 'code-block-pro-last-theme',
            getStorage: () => localStorage,
            partialize: (state) => ({
                previousTheme: state?.previousTheme ?? null,
            }),
        },
    ),
);
