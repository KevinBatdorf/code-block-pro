import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { Attributes } from '../types';

type ThemeType = {
    previousTheme: string;
    previousLineHeight: string;
    previousFontFamily?: string;
    previousFontSize: string;
    previousHeaderType: string;
    previousFooterType?: string;
    previousClampFonts?: boolean;
    previousDisablePadding?: boolean;
    previousLineNumbers?: boolean;
    previousHighlightingHover?: boolean;
    previousCopyButton: boolean;
    previousCopyButtonType: string;
    previousCopyButtonString?: string;
    previousCopyButtonStringCopied?: string;
    previousTabSize: number;
    previousUseTabs?: boolean;
    // previousEnableMaxHeight?: boolean;
    // previousSeeMoreAfterLine?: string;
    previousSeeMoreType?: string;
    previousSeeMoreString?: string;
    previousSeeMoreTransition?: boolean;
    updateThemeHistory: (settings: Partial<Attributes>) => void;
};
const path = '/code-block-pro/v1/settings';
const getSettings = async (name: string) => {
    const allSettings = await apiFetch({ path });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    return allSettings?.[name];
};
const defaultSettings = {
    previousTheme: 'nord',
    previousLineHeight: '1.25rem',
    previousFontFamily: 'Code-Pro-JetBrains-Mono',
    previousFontSize: '.875rem',
    previousHeaderType: 'headlights',
    previousFooterType: 'none',
    previousClampFonts: false,
    previousDisablePadding: false,
    previousLineNumbers: false,
    previousHighlightingHover: false,
    previousCopyButton: true,
    previousCopyButtonType: 'heroicons',
    previousCopyButtonString: __('Copy', 'code-block-pro'),
    previusCopyButtonStringCopied: __('Copied', 'code-block-pro'),
    previousTabSize: 2,
    previousUseTabs: false,
    // TODO: maybe impliment these with an extra UI to make them optional
    // previousEnableMaxHeight: undefined,
    // previousSeeMoreAfterLine: undefined,
    previousSeeMoreType: '',
    previousSeeMoreString: '',
    previousSeeMoreTransition: false,
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
                version,
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

export const useThemeStore = create<ThemeType>()(
    persist(
        devtools(
            (set) => ({
                ...defaultSettings,
                updateThemeHistory(attributes: Partial<Attributes>) {
                    set((state) => {
                        return Object.keys(attributes).reduce<
                            Partial<ThemeType>
                        >(
                            (acc, attr) => {
                                const att = attr as keyof Attributes;
                                const fmted = `previous${
                                    attr.charAt(0).toUpperCase() + attr.slice(1)
                                }` as keyof ThemeType;
                                const keyExists =
                                    Object.keys(state).includes(fmted);
                                return keyExists
                                    ? { ...acc, [fmted]: attributes[att] }
                                    : acc;
                            },
                            { ...state },
                        );
                    });
                },
            }),
            { name: 'Code Block Pro Theme Settings' },
        ),
        {
            name: 'code_block_pro_settings',
            storage: createJSONStorage(() => storage),
        },
    ),
);

// const useThemeStoreReady =
/* Hook useful for when you need to wait on the async state to hydrate */
export const useThemeStoreReady = () => {
    const [hydrated, setHydrated] = useState(useThemeStore.persist.hasHydrated);
    useEffect(() => {
        const unsubFinishHydration = useThemeStore.persist.onFinishHydration(
            () => setHydrated(true),
        );
        return () => {
            unsubFinishHydration();
        };
    }, []);
    return hydrated;
};
