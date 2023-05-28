import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

type Settings = {
    seenNotices: string[];
    hiddenThemes: string[];
    setSeenNotice: (notice: string) => void;
    toggleHiddenTheme: (theme: string) => void;
};
const path = '/code-block-pro/v1/settings';
const getSettings = async (name: string) => {
    const allSettings = await apiFetch({ path });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    return allSettings?.[name];
};
const defaultSettings = {
    seenNotices: [],
    hiddenThemes: [],
};
const storage = {
    getItem: async (name: string) => {
        const settings = await getSettings(name);
        return JSON.stringify({
            version: settings?.version ?? 0,
            state: settings || defaultSettings,
        });
    },
    setItem: async (name: string, value: string) => {
        const { state, version } = JSON.parse(value);
        const data = {
            [name]: Object.assign(
                (await getSettings(name)) || defaultSettings,
                state,
                { version },
            ),
        };
        await apiFetch({ path, method: 'POST', data });
    },
    removeItem: async (name: string) => {
        const data = { [name]: null };
        await apiFetch({ path, method: 'POST', data });
        return undefined;
    },
};

export const useSettingsStore = create<Settings>()(
    persist(
        devtools(
            (set) => ({
                ...defaultSettings,
                setSeenNotice(notice: string) {
                    set((state) => {
                        if (state.seenNotices.includes(notice)) return state;
                        return { seenNotices: [...state.seenNotices, notice] };
                    });
                },
                toggleHiddenTheme(theme: string) {
                    set((state) => ({
                        hiddenThemes: state.hiddenThemes.includes(theme)
                            ? state.hiddenThemes.filter((t) => t !== theme)
                            : [...state.hiddenThemes, theme],
                    }));
                },
            }),
            { name: 'Code Block Pro Settings' },
        ),
        {
            name: 'code_block_pro_settings_2',
            storage: createJSONStorage(() => storage),
        },
    ),
);

/* Hook useful for when you need to wait on the async state to hydrate */
export const useSettingsStoreReady = () => {
    const [hydrated, setHydrated] = useState(
        useSettingsStore.persist.hasHydrated,
    );
    useEffect(() => {
        const unsubFinishHydration = useSettingsStore.persist.onFinishHydration(
            () => setHydrated(true),
        );
        return () => {
            unsubFinishHydration();
        };
    }, []);
    return hydrated;
};
