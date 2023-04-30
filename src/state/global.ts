import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type GlobalTypes = {
    previousSettings: {
        copyButton: boolean;
    };
    bringAttentionToPanel: false | string;
    setPreviousSettings: (
        settings: Partial<GlobalTypes['previousSettings']>,
    ) => void;
    setBringAttentionToPanel: (b: false | string) => void;
};

export const useGlobalStore = create<GlobalTypes>()(
    persist(
        devtools(
            (set) => ({
                previousSettings: {
                    // This should go into settings.tsx and persist to the db
                    copyButton: true,
                },
                setPreviousSettings(
                    s: Partial<GlobalTypes['previousSettings']>,
                ) {
                    set((state) => ({
                        previousSettings: { ...state.previousSettings, ...s },
                    }));
                },
                bringAttentionToPanel: false,
                setBringAttentionToPanel: (bringAttentionToPanel) => {
                    set(() => ({ bringAttentionToPanel }));
                },
            }),
            { name: 'Code Block Pro Globals' },
        ),
        {
            name: 'code-block-pro-last-globals',
            partialize: (state) => {
                return {
                    previousSettings: state.previousSettings,
                };
            },
        },
    ),
);
