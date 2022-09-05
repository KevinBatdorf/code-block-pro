import { Lang } from 'shiki';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type LanguageType = {
    previousLanguage: Lang;
    setPreviousLanguage: (language: Lang) => void;
    recentLanguages: Lang[];
    addRecentLanguage: (language: Lang) => void;
};
export const useLanguageStore = create<LanguageType>()(
    persist(
        devtools(
            (set, get) => ({
                previousLanguage: 'javascript' as Lang,
                setPreviousLanguage(language: Lang) {
                    set({ previousLanguage: language });
                    get().addRecentLanguage(language);
                },
                recentLanguages: [] as Lang[],
                addRecentLanguage(language: Lang) {
                    // Limit to the last 3
                    set((state) => {
                        if (state.recentLanguages.includes(language)) {
                            return state;
                        }
                        return {
                            recentLanguages: [
                                ...(state.recentLanguages?.slice(-2) ?? []),
                                language,
                            ],
                        };
                    });
                },
            }),
            { name: 'Code Block Pro Language' },
        ),
        {
            name: 'code-block-pro-last-language',
            getStorage: () => localStorage,
            partialize: (state) => ({
                previousLanguage: state?.previousLanguage ?? null,
                recentLanguages: state?.recentLanguages ?? [],
            }),
        },
    ),
);
