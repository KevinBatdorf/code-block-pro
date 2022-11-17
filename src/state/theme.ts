import apiFetch from '@wordpress/api-fetch';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
    updateThemeHistory: (settings: Partial<Attributes>) => void;
};
const path = '/wp/v2/settings';
const getSettings = async (name: string) => {
    const allSettings = await apiFetch({ path });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    return allSettings?.[name];
};
export const useThemeStore = create<ThemeType>()(
    persist(
        devtools(
            (set) => ({
                previousTheme: 'nord',
                previousLineHeight: '1.25rem',
                previousFontFamily: undefined,
                previousFontSize: '.875rem',
                previousHeaderType: 'headlights',
                previousFooterType: undefined,
                previousClampFonts: undefined,
                previousDisablePadding: undefined,
                previousLineNumbers: undefined,
                updateThemeHistory(attributes) {
                    set((state) => ({
                        ...state,
                        previousTheme: attributes.theme,
                        previousLineHeight: attributes.lineHeight,
                        previousFontFamily: attributes.fontFamily,
                        previousFontSize: attributes.fontSize,
                        previousHeaderType: attributes.headerType,
                        previousFooterType: attributes.footerType,
                        previousClampFonts: attributes.clampFonts,
                        previousDisablePadding: attributes.disablePadding,
                        previousLineNumbers: attributes.lineNumbers,
                    }));
                },
            }),
            { name: 'Code Block Pro Theme Settings' },
        ),
        {
            name: 'code_block_pro_settings',
            getStorage: () => ({
                getItem: async (name: string) => {
                    const settings = await getSettings(name);
                    return JSON.stringify({
                        version: settings.version,
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
