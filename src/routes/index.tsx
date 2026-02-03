import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { BenefitsSection } from "~/components/BenefitsSection";
import { CommunitySection } from "~/components/CommunitySection";
import { CurriculumSection } from "~/components/CurriculumSection";
import { FAQSection } from "~/components/FAQSection";
import { FinalCTASection } from "~/components/FinalCTASection";
import { Hero } from "~/components/Hero";
import { HowItWorksSection } from "~/components/HowItWorksSection";
import { PricingSection } from "~/components/PricingSection";
import { SalaryStatsSection } from "~/components/SalaryStatsSection";
import { SectionDivider } from "~/components/SectionDivider";
import { TestimonialsSection } from "~/components/TestimonialsSection";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	useEffect(() => {
		// Add structured data for SEO
		const structuredData = {
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			name: "Day Done",
			description:
				"A todo app that helps you focus on managing the jobs you need to get done today",
			url: typeof window !== "undefined" ? window.location.origin : "",
			applicationCategory: "ProductivityApplication",
		};

		const faqStructuredData = {
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: [
				{
					"@type": "Question",
					name: "How does Day Done help me be more productive?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Day Done focuses on what matters today. Instead of overwhelming you with endless lists, it helps you prioritize and complete the tasks that need to get done now.",
					},
				},
				{
					"@type": "Question",
					name: "Can I use Day Done for free?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Yes! Day Done offers a free tier that includes all the essential features you need to manage your daily tasks effectively.",
					},
				},
				{
					"@type": "Question",
					name: "What makes Day Done different from other todo apps?",
					acceptedAnswer: {
						"@type": "Answer",
						text: "Day Done is designed around a today-first philosophy. We help you focus on the work that needs to happen now, reducing overwhelm and increasing your daily productivity.",
					},
				},
			],
		};

		// Remove existing structured data scripts if any
		const existingScripts = document.querySelectorAll(
			'script[type="application/ld+json"]',
		);
		for (const script of existingScripts) {
			script.remove();
		}

		// Add new structured data
		const addScript = (data: object) => {
			const script = document.createElement("script");
			script.type = "application/ld+json";
			script.textContent = JSON.stringify(data);
			document.head.appendChild(script);
		};

		addScript(structuredData);
		addScript(faqStructuredData);

		return () => {
			// Cleanup on unmount
			const scripts = document.querySelectorAll(
				'script[type="application/ld+json"]',
			);
			for (const script of scripts) {
				script.remove();
			}
		};
	}, []);

	return (
		<div className="flex flex-col min-h-[calc(100vh-3.5rem)] relative">
			{/* Noise Texture */}
			<div className="noise-overlay"></div>

			{/* Background Ambience */}
			<div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--foreground),0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--foreground),0.03)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-20"></div>
				<div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] animate-blob"></div>
				<div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
				<div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[100px] animate-pulse-slow"></div>
			</div>

			<main className="flex-1 relative z-10">
				<Hero />
				<SectionDivider />
				<SalaryStatsSection />
				<SectionDivider />
				<BenefitsSection />
				<SectionDivider />
				<CurriculumSection />
				<SectionDivider />
				<TestimonialsSection />
				<SectionDivider />
				<CommunitySection />
				<SectionDivider />
				<HowItWorksSection />
				<SectionDivider />
				<ClientOnly>
					<PricingSection />
				</ClientOnly>
				<SectionDivider />
				<FAQSection />
				<SectionDivider />
				<FinalCTASection />
			</main>
		</div>
	);
}
