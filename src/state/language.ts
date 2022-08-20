import { Lang } from 'shiki';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type LanguageType = {
    previousLanguage: Lang;
    setPreviousLanguage: (language: Lang) => void;
};
export const useLanguageStore = create<LanguageType>()(
    persist(
        devtools(
            (set) => ({
                previousLanguage: 'javascript',
                setPreviousLanguage(language: Lang) {
                    set({ previousLanguage: language });
                },
            }),
            { name: 'Code Block Pro Language' },
        ),
        {
            name: 'code-block-pro-last-language',
            getStorage: () => localStorage,
            partialize: (state) => ({
                previousLanguage: state?.previousLanguage ?? null,
            }),
        },
    ),
);
