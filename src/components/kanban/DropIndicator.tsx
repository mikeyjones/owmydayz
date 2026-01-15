import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

interface DropIndicatorProps {
  edge: Edge | null;
  gap?: string;
}

export function DropIndicator({ edge, gap = "8px" }: DropIndicatorProps) {
  if (!edge) return null;

  const edgeStyles: Record<Edge, React.CSSProperties> = {
    top: {
      top: `calc(-1 * (${gap} / 2))`,
      left: 0,
      right: 0,
      height: "2px",
    },
    bottom: {
      bottom: `calc(-1 * (${gap} / 2))`,
      left: 0,
      right: 0,
      height: "2px",
    },
    left: {
      left: `calc(-1 * (${gap} / 2))`,
      top: 0,
      bottom: 0,
      width: "2px",
    },
    right: {
      right: `calc(-1 * (${gap} / 2))`,
      top: 0,
      bottom: 0,
      width: "2px",
    },
  };

  return (
    <div
      className="absolute bg-primary pointer-events-none z-10"
      style={edgeStyles[edge]}
    >
      {/* Terminal circles for horizontal indicators */}
      {(edge === "top" || edge === "bottom") && (
        <>
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-primary" />
          <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-primary" />
        </>
      )}
    </div>
  );
}
