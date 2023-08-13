import { colord, AnyColor } from 'colord';
import { Attributes, Lang } from '../../../types';
import { findBackgroundColor, findTextColor } from '../../../util/colors';
import { languages } from '../../../util/languages';

export const SimpleStringEnd = (attributes: Attributes) => {
    const {
        language,
        bgColor,
        textColor,
        footerString,
        footerLink,
        footerLinkTarget,
        disablePadding,
    } = attributes;
    const textC = colord(textColor as AnyColor);
    const text = textColor?.startsWith('var(')
        ? findTextColor(attributes) ?? textColor
        : textC.isDark()
        ? textC.lighten(0.05).toHex()
        : textC.darken(0.05).toHex();
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                padding: disablePadding ? '10px 0 0 0' : '10px',
                width: '100%',
                justifyContent: 'flex-end',
                backgroundColor: findBackgroundColor(attributes) ?? bgColor,
                color: text,
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
            }}>
            <Inner
                text={footerString || languages[language as Lang]}
                color={text}
                link={footerLink}
                linkTarget={footerLinkTarget}
            />
        </span>
    );
};

const Inner = ({
    text,
    color,
    link,
    linkTarget,
}: {
    text?: string;
    color: string;
    link?: string;
    linkTarget?: boolean;
}) => {
    if (!link) return <>{text}</>;
    const style = {
        color,
        // attempt to reset the link to not inheret from theme
        textDecoration: 'none',
        fontWeight: 'normal',
        border: 'none',
        background: 'none',
        borderRadius: '0',
        padding: '0',
        margin: '0',
    };
    if (linkTarget) {
        return (
            <a
                className="cbp-footer-link"
                href={link}
                style={style}
                target={'_blank'}
                // Gutenberg required
                rel={'noopener noreferrer'}>
                {text}
            </a>
        );
    }
    return (
        <a className="cbp-footer-link" href={link} style={style}>
            {text}
        </a>
    );
};
