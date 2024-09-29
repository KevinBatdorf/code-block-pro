import { fixupConfigRules } from "@eslint/compat";
import noOnlyTests from "eslint-plugin-no-only-tests";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/node_modules/", "**/pkg/", "**/build/"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:cypress/recommended",
    "prettier",
)), {
    plugins: {
        "no-only-tests": noOnlyTests,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.jest,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },

            allowImportExportEverywhere: true,
        },
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "require-await": "error",

        quotes: ["error", "single", {
            avoidEscape: true,
        }],

        "comma-dangle": ["error", "always-multiline"],
        "array-element-newline": ["error", "consistent"],

        "no-constant-condition": ["error", {
            checkLoops: true,
        }],

        "no-multi-spaces": ["error"],
        semi: ["error", "always"],
        "space-in-parens": ["error", "never"],

        "key-spacing": ["error", {
            afterColon: true,
        }],

        "no-only-tests/no-only-tests": "warn",
        "space-infix-ops": ["error"],

        "space-before-function-paren": ["error", {
            anonymous: "always",
            named: "never",
            asyncArrow: "always",
        }],

        "react/react-in-jsx-scope": "off",
        "quote-props": ["error", "as-needed"],

        "no-multiple-empty-lines": ["error", {
            max: 1,
        }],

        "@typescript-eslint/no-var-requires": "off",

        "lines-around-comment": ["error", {
            beforeBlockComment: true,
            allowBlockStart: true,
        }],
    },
}];