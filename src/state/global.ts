import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type GlobalTypes = {
    seenNotices: string[];
    setSeenNotice: (notice: string) => void;
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
                seenNotices: [],
                setSeenNotice(notice: string) {
                    set((state) => {
                        if (state.seenNotices.includes(notice)) return state;
                        return { seenNotices: [...state.seenNotices, notice] };
                    });
                },
                // If any of these values have changed, we will use these for defaults.
                // Themes and languages are handled separately.
                previousSettings: {
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
        {
            name: 'code-block-pro-last-globals',
            getStorage: () => localStorage,
            partialize: (state) => ({
                seenNotices: state?.seenNotices ?? [],
                previousSettings: state?.previousSettings ?? {},
            }),
        },
    ),
);
