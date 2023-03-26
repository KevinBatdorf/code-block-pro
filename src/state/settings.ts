import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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
export const useSettingsStore = create<Settings>()(
    persist(
        devtools(
            (set) => ({
                seenNotices: [],
                hiddenThemes: [],
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
            getStorage: () => ({
                getItem: async (name: string) => {
                    const settings = await getSettings(name);
                    return JSON.stringify({
                        version: settings?.version ?? 0,
                        state: settings,
                    });
                },
                setItem: async (name: string, value: string) => {
                    const { state, version } = JSON.parse(value);
                    const data = {
                        [name]: Object.assign(
                            (await getSettings(name)) ?? {},
                            state,
                            version,
                        ),
                    };
                    await apiFetch({ path, method: 'POST', data });
                },
                removeItem: async (name: string) => {
                    const data = { [name]: null };
                    return await apiFetch({ path, method: 'POST', data });
                },
            }),
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
