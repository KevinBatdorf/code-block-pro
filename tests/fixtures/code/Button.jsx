import { useState } from 'react';

export const Button = ({ label, onPress }) => {
	const [count, setCount] = useState(0);
	return (
		<button type="button" onClick={() => setCount(count + 1)}>
			{label} ({count})
		</button>
	);
};
