import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

interface ColumnDropIndicatorProps {
	edge: Extract<Edge, "left" | "right"> | null;
	gap?: string;
}

export function ColumnDropIndicator({
	edge,
	gap = "16px",
}: ColumnDropIndicatorProps) {
	if (!edge) return null;

	const edgeStyles: Record<
		Extract<Edge, "left" | "right">,
		React.CSSProperties
	> = {
		left: {
			left: `calc(-1 * (${gap} / 2))`,
			top: 0,
			bottom: 0,
			width: "3px",
		},
		right: {
			right: `calc(-1 * (${gap} / 2))`,
			top: 0,
			bottom: 0,
			width: "3px",
		},
	};

	return (
		<div
			className="absolute bg-primary pointer-events-none z-20"
			style={edgeStyles[edge]}
		>
			{/* Terminal circles for vertical indicators */}
			<div className="absolute -left-1 -top-1 w-3 h-3 rounded-full bg-primary" />
			<div className="absolute -left-1 -bottom-1 w-3 h-3 rounded-full bg-primary" />
		</div>
	);
}
