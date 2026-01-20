import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColumnDropIndicator } from "./ColumnDropIndicator";

describe("ColumnDropIndicator", () => {
	describe("rendering", () => {
		it("should render nothing when edge is null", () => {
			const { container } = render(<ColumnDropIndicator edge={null} />);
			expect(container.firstChild).toBeNull();
		});

		it("should render indicator when edge is left", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const indicator = container.querySelector('[class*="bg-primary"]');
			expect(indicator).toBeInTheDocument();
		});

		it("should render indicator when edge is right", () => {
			const { container } = render(<ColumnDropIndicator edge="right" />);
			const indicator = container.querySelector('[class*="bg-primary"]');
			expect(indicator).toBeInTheDocument();
		});

		it("should render terminal circles for left edge", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const circles = container.querySelectorAll('[class*="rounded-full"]');
			expect(circles).toHaveLength(2);
		});

		it("should render terminal circles for right edge", () => {
			const { container } = render(<ColumnDropIndicator edge="right" />);
			const circles = container.querySelectorAll('[class*="rounded-full"]');
			expect(circles).toHaveLength(2);
		});
	});

	describe("edge variants", () => {
		it("should render with left edge", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const indicator = container.querySelector('[class*="bg-primary"]');
			expect(indicator).toBeInTheDocument();
		});

		it("should render with right edge", () => {
			const { container } = render(<ColumnDropIndicator edge="right" />);
			const indicator = container.querySelector('[class*="bg-primary"]');
			expect(indicator).toBeInTheDocument();
		});

		it("should accept custom gap parameter", () => {
			const { container } = render(
				<ColumnDropIndicator edge="left" gap="24px" />,
			);
			const indicator = container.querySelector('[class*="bg-primary"]');
			expect(indicator).toBeInTheDocument();
		});
	});

	describe("styling", () => {
		it("should have absolute positioning", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const indicator = container.querySelector('[class*="absolute"]');
			expect(indicator).toBeInTheDocument();
		});

		it("should be non-interactive with pointer-events-none", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const indicator = container.querySelector(
				'[class*="pointer-events-none"]',
			);
			expect(indicator).toBeInTheDocument();
		});

		it("should have high z-index for visibility", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const indicator = container.querySelector('[class*="z-20"]');
			expect(indicator).toBeInTheDocument();
		});
	});

	describe("terminal circles", () => {
		it("should position circles at top and bottom", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const circles = container.querySelectorAll('[class*="rounded-full"]');

			const topCircle = circles[0] as HTMLElement;
			const bottomCircle = circles[1] as HTMLElement;

			expect(topCircle.className).toContain("-top-1");
			expect(bottomCircle.className).toContain("-bottom-1");
		});

		it("should have consistent size for both circles", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const circles = container.querySelectorAll('[class*="rounded-full"]');

			for (const circle of circles) {
				expect(circle.className).toContain("w-3");
				expect(circle.className).toContain("h-3");
			}
		});

		it("should use primary color for circles", () => {
			const { container } = render(<ColumnDropIndicator edge="left" />);
			const circles = container.querySelectorAll('[class*="rounded-full"]');

			for (const circle of circles) {
				expect(circle.className).toContain("bg-primary");
			}
		});
	});
});
