// Shared with the profile manager, a separate script that loads only for users who may change profiles.

/** Opens the profile manager, when it is listening: `{ clientId, slug, view: 'edit' | 'manage' }`. */
export const OPEN_PROFILES = 'codeBlockPro.openProfiles';

/** A profile was saved or added: its slug. */
export const PROFILES_CHANGED = 'codeBlockPro.profilesChanged';
