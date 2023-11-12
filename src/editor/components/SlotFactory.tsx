import { createSlotFill } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { AttributesPropsAndSetter } from '../../types';
import { decode, encode } from '../../util/code';
import { languages } from '../../util/languages';

export const SlotFactory = ({
    name,
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { name: string }) => {
    const { Slot } = useMemo(() => {
        return createSlotFill(name);
    }, [name]);
    return (
        <Slot
            fillProps={{
                attributes,
                setAttributes,
                languages,
                getCode: () => decode(attributes.code, attributes),
                setCode: (code: string) =>
                    setAttributes({
                        code: encode(code, attributes),
                    }),
            }}
        />
    );
};
