import { colord, AnyColor } from 'colord';
import { Attributes, Lang } from '../../../types';
import { languages } from '../../../util/languages';

export const SimpleStringStart = ({
    language,
    bgColor,
    textColor,
    footerString,
    footerLink,
    footerLinkTarget,
    disablePadding,
}: Partial<Attributes>) => {
    const bgC = colord(bgColor as AnyColor);
    const textC = colord(textColor as AnyColor);
    const text = textC.isDark() ? textC.lighten(0.05) : textC.darken(0.05);
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                padding: disablePadding ? '10px 0 0 0' : '10px',
                width: '100%',
                justifyContent: 'flex-start',
                backgroundColor: bgC.toHex(),
                color: text.toHex(),
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
            }}>
            <Inner
                text={footerString || languages[language as Lang]}
                color={text.toHex()}
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
