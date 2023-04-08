import { applyFilters } from '@wordpress/hooks';
import defaultThemes from '../defaultThemes.json';

const themes = () =>
    applyFilters('blocks.codeBlockPro.themes', defaultThemes) as Record<
        string,
        { name: string; priority?: boolean; custom?: boolean }
    >;

const themesNormalized = () =>
    Object.entries(themes()).map(([slug, { name, priority, custom }]) => ({
        name,
        slug,
        priority,
        custom,
    }));
export const getPriorityThemes = () =>
    themesNormalized().filter(({ priority }) => priority);

export const getNormalThemes = () =>
    themesNormalized().filter(({ priority, custom }) => !priority && !custom);

export const getCustomThemes = () =>
    themesNormalized().filter(({ custom }) => custom);
