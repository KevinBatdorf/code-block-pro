import { applyFilters } from '@wordpress/hooks';
import defaultThemes from '../defaultThemes.json';

const themes = () =>
    applyFilters('blocks.codeBlockPro.themes', defaultThemes) as Record<
        string,
        { name: string; priority?: boolean }
    >;

const themesNormalized = () =>
    Object.entries(themes()).map(([slug, { name, priority }]) => ({
        name,
        slug,
        priority,
    }));
export const getPriorityThemes = () =>
    themesNormalized().filter(({ priority }) => priority);

export const getNormalThemes = () =>
    themesNormalized().filter(({ priority }) => !priority);
