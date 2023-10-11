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
                                'Read-only mode: The %s capability is required.',
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
