type Point = { x: number; y: number };

const origin: Point = { x: 0, y: 0 };

export function distance(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

// Twelve lines exactly, no more, no less.
export const fromOrigin = (p: Point) => distance(origin, p);
