import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type GlobalTypes = {
    bringAttentionToPanel: false | string;
    setBringAttentionToPanel: (b: false | string) => void;
};

export const useGlobalStore = create<GlobalTypes>()(
    devtools(
        (set) => ({
            bringAttentionToPanel: false,
            setBringAttentionToPanel: (bringAttentionToPanel) => {
                set(() => ({ bringAttentionToPanel }));
            },
        }),
        { name: 'Code Block Pro Globals' },
    ),
);
