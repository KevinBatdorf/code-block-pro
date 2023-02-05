import { useEffect, useState } from '@wordpress/element';
import { useLanguageStore } from '../state/language';
import { AttributesPropsAndSetter, Lang } from '../types';

export const useLanguage = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, set] = useState<Lang>(attributes.language);
    const { previousLanguage, setPreviousLanguage } = useLanguageStore();
    const setLanguage = (language: Lang) => {
        setAttributes({ language });
        set(language);
        setPreviousLanguage(language);
    };

    useEffect(() => {
        if (language) return;
        setAttributes({ language: previousLanguage });
    }, [language, previousLanguage, setAttributes]);

    useEffect(() => {
        set(attributes.language);
    }, [attributes.language]);

    return [language, setLanguage] as [Lang, typeof setLanguage];
};
