// Column color palette - each column gets a unique color based on its index
// These colors work well in both light and dark modes

export interface ColumnColor {
	name: string;
	bg: string; // Background color (subtle)
	border: string; // Border color
	accent: string; // Accent color for task highlights
	headerBg: string; // Header background
	text: string; // Text color for accents
}

// A vibrant but balanced color palette
export const COLUMN_COLORS: ColumnColor[] = [
	{
		name: "blue",
		bg: "bg-blue-500/5",
		border: "border-blue-500/30",
		accent: "border-l-blue-500",
		headerBg: "bg-blue-500/10",
		text: "text-blue-600 dark:text-blue-400",
	},
	{
		name: "purple",
		bg: "bg-purple-500/5",
		border: "border-purple-500/30",
		accent: "border-l-purple-500",
		headerBg: "bg-purple-500/10",
		text: "text-purple-600 dark:text-purple-400",
	},
	{
		name: "emerald",
		bg: "bg-emerald-500/5",
		border: "border-emerald-500/30",
		accent: "border-l-emerald-500",
		headerBg: "bg-emerald-500/10",
		text: "text-emerald-600 dark:text-emerald-400",
	},
	{
		name: "orange",
		bg: "bg-orange-500/5",
		border: "border-orange-500/30",
		accent: "border-l-orange-500",
		headerBg: "bg-orange-500/10",
		text: "text-orange-600 dark:text-orange-400",
	},
	{
		name: "pink",
		bg: "bg-pink-500/5",
		border: "border-pink-500/30",
		accent: "border-l-pink-500",
		headerBg: "bg-pink-500/10",
		text: "text-pink-600 dark:text-pink-400",
	},
	{
		name: "cyan",
		bg: "bg-cyan-500/5",
		border: "border-cyan-500/30",
		accent: "border-l-cyan-500",
		headerBg: "bg-cyan-500/10",
		text: "text-cyan-600 dark:text-cyan-400",
	},
	{
		name: "amber",
		bg: "bg-amber-500/5",
		border: "border-amber-500/30",
		accent: "border-l-amber-500",
		headerBg: "bg-amber-500/10",
		text: "text-amber-600 dark:text-amber-400",
	},
	{
		name: "indigo",
		bg: "bg-indigo-500/5",
		border: "border-indigo-500/30",
		accent: "border-l-indigo-500",
		headerBg: "bg-indigo-500/10",
		text: "text-indigo-600 dark:text-indigo-400",
	},
	{
		name: "rose",
		bg: "bg-rose-500/5",
		border: "border-rose-500/30",
		accent: "border-l-rose-500",
		headerBg: "bg-rose-500/10",
		text: "text-rose-600 dark:text-rose-400",
	},
	{
		name: "teal",
		bg: "bg-teal-500/5",
		border: "border-teal-500/30",
		accent: "border-l-teal-500",
		headerBg: "bg-teal-500/10",
		text: "text-teal-600 dark:text-teal-400",
	},
];

/**
 * Get a column color based on its index
 * Colors cycle if there are more columns than colors
 */
export function getColumnColor(index: number): ColumnColor {
	return COLUMN_COLORS[index % COLUMN_COLORS.length];
}

/**
 * Simple hash function to convert a string to a number
 * Used to consistently map column IDs to colors
 */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Get a column color based on its ID
 * This ensures colors remain consistent even when columns are reordered
 */
export function getColumnColorById(columnId: string): ColumnColor {
	const hash = hashString(columnId);
	return COLUMN_COLORS[hash % COLUMN_COLORS.length];
}

/**
 * Default color for system columns or fallback
 */
export const DEFAULT_COLUMN_COLOR: ColumnColor = {
	name: "slate",
	bg: "bg-slate-500/5",
	border: "border-slate-500/30",
	accent: "border-l-slate-400",
	headerBg: "bg-slate-500/10",
	text: "text-slate-600 dark:text-slate-400",
};
