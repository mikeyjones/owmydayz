import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
	it("renders with default variant", () => {
		render(<Badge>Default Badge</Badge>);
		const badge = screen.getByText("Default Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("bg-primary");
		expect(badge).toHaveClass("text-primary-foreground");
	});

	it("renders with secondary variant", () => {
		render(<Badge variant="secondary">Secondary Badge</Badge>);
		const badge = screen.getByText("Secondary Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("bg-secondary");
		expect(badge).toHaveClass("text-secondary-foreground");
	});

	it("renders with destructive variant", () => {
		render(<Badge variant="destructive">Destructive Badge</Badge>);
		const badge = screen.getByText("Destructive Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("bg-destructive");
		expect(badge).toHaveClass("text-destructive-foreground");
	});

	it("renders with outline variant", () => {
		render(<Badge variant="outline">Outline Badge</Badge>);
		const badge = screen.getByText("Outline Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("text-foreground");
		expect(badge).not.toHaveClass("bg-primary");
	});

	it("merges custom className with variant classes", () => {
		render(<Badge className="custom-class">Custom Badge</Badge>);
		const badge = screen.getByText("Custom Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("custom-class");
		expect(badge).toHaveClass("bg-primary"); // still has default variant
	});

	it("passes additional props to the element", () => {
		render(
			<Badge data-testid="badge-element" role="status">
				Props Badge
			</Badge>,
		);
		const badge = screen.getByTestId("badge-element");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveAttribute("role", "status");
		expect(badge).toHaveTextContent("Props Badge");
	});
});
