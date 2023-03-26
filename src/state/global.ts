import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type GlobalTypes = {
    previousSettings: {
        copyButton: boolean;
    };
    setPreviousSettings: (
        settings: Partial<GlobalTypes['previousSettings']>,
    ) => void;
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
            }),
            { name: 'Code Block Pro Globals' },
        ),
        { name: 'code-block-pro-last-globals' },
    ),
);
