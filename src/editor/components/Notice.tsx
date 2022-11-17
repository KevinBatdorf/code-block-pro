import { TextControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useGlobalStore } from '../../state/global';

export const Notice = () => {
    const { seenNotices, setSeenNotice } = useGlobalStore();
    const [showEmail, setShowEmail] = useState(false);
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const maybeEmail = useSelect((select) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        const user = select('core').getCurrentUser() as { id: number };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        const details = select('core').getEntityRecord(
            'root',
            'user',
            user.id,
        ) as { email: string };
        return details?.email;
    }, []);
    const sendEmail = () => {
        fetch('https://www.kevinbatdorf.com/api/interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, product: 'code-block-pro' }),
        }).finally(() => setEmailSent(true));
    };

    useEffect(() => {
        setEmail(maybeEmail);
    }, [maybeEmail]);

    useEffect(() => {
        if (!emailSent) return;
        const id = setTimeout(() => {
            setSeenNotice('beta-signup');
        }, 4000);
        return () => clearTimeout(id);
    }, [emailSent, setSeenNotice]);

    return null;
    if (seenNotices.includes('beta-signup')) return null;
    if (emailSent)
        return (
            <p className="mt-4 italic">
                {__(
                    'Thanks! Check your inbox for more info.',
                    'code-block-pro',
                )}
            </p>
        );
    return (
        <>
            {showEmail ? (
                <>
                    <TextControl
                        help={__(
                            "We'll send you an email to confirm.",
                            'code-block-pro',
                        )}
                        label={__('Email', 'code-block-pro')}
                        onChange={setEmail}
                        value={email}
                    />
                    <Button className="-mt-2" isPrimary onClick={sendEmail}>
                        {__('Send', 'code-block-pro')}
                    </Button>
                </>
            ) : (
                <div className="relative bg-blue-50 hover:bg-blue-100 border-t border-blue-100 -m-4 mt-0 p-0 px-4">
                    <button
                        className="absolute top-0 right-0 border-0 mt-1 mr-2 leading-none p-0 bg-transparent cursor-pointer"
                        title={__('Dismiss', 'code-block-pro')}
                        type="button"
                        onClick={() => setSeenNotice('beta-signup')}>
                        x
                    </button>

                    <button
                        className="my-4 p-0 underline caret-pink-600 m-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500 text-left text-lg leading-5 font-medium cursor-pointer"
                        type="button"
                        title={__('Press here', 'code-block-pro')}
                        onClick={() => setShowEmail(true)}>
                        Notify me about new themes and early adopter discount
                        (limited spots).
                    </button>
                </div>
            )}
        </>
    );
};
