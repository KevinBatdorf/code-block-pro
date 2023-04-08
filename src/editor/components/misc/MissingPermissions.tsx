import { Tip, Card, CardBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export const MissingPermissionsTip = () => (
    <Card>
        <CardBody>
            <Tip>
                <span
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                        __html: sprintf(
                            __(
                                'The %s capability is required to edit this block. Contact an admin to enable this feature. This is not an error.',
                                'code-block-pro',
                            ),
                            '<code>unfiltered_html</code>',
                        ),
                    }}
                />
            </Tip>
        </CardBody>
    </Card>
);
