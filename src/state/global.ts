import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type GlobalTypes = {
    seenNotices: string[];
    setSeenNotice: (notice: string) => void;
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
            }),
            { name: 'Code Block Pro Globals' },
        ),
        {
            name: 'code-block-pro-last-globals',
            getStorage: () => localStorage,
            partialize: (state) => ({
                seenNotices: state?.seenNotices ?? [],
            }),
        },
    ),
);
