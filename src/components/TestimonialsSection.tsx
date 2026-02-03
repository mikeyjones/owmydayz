import { Quote, Skull, Star } from "lucide-react";
import { FadeIn } from "~/components/ui/fade-in";

const testimonials = [
	{
		name: "Julius Caesar",
		role: "Roman Emperor (deceased 44 BC)",
		badge: "Conquered Gaul ✓",
		image: "JC",
		quote:
			"Veni, vidi, vici... my to-do list. Before Day Done, I kept forgetting to beware the Ides of March. One star off because the mobile app wasn't available in 44 BC.",
		rating: 4,
	},
	{
		name: "Leonardo da Vinci",
		role: "Renaissance Polymath (deceased 1519)",
		badge: "14 unfinished paintings",
		image: "LV",
		quote:
			"Finally, an app that understands I need to track 'invent helicopter', 'paint mysterious woman smiling', and 'study anatomy' all in the same day. My only regret is not finishing more tasks before dying.",
		rating: 5,
	},
	{
		name: "Cleopatra VII",
		role: "Queen of Egypt (deceased 30 BC)",
		badge: "Ruled the Nile ✓",
		image: "C7",
		quote:
			"Managing a kingdom, two Roman generals, and an asp situation is a lot. Day Done helped me prioritize. Would have given 5 stars but the snake task did not go as planned.",
		rating: 4,
	},
	{
		name: "William Shakespeare",
		role: "Playwright (deceased 1616)",
		badge: "37 plays completed",
		image: "WS",
		quote:
			"To do, or not to do, that is no longer the question. With Day Done, I finished Hamlet AND remembered to pick up milk. Forsooth, 'tis the finest productivity app in all the realm!",
		rating: 5,
	},
	{
		name: "Napoleon Bonaparte",
		role: "French Emperor (deceased 1821)",
		badge: "Conquered Europe ✓",
		image: "NB",
		quote:
			"Day Done helped me organize the invasion of Russia. The app worked perfectly; my planning, less so. Still, I blame the winter, not the todo list. Magnifique!",
		rating: 5,
	},
	{
		name: "Benjamin Franklin",
		role: "Founding Father (deceased 1790)",
		badge: "Discovered electricity ✓",
		image: "BF",
		quote:
			"Early to bed, early to rise, and check off your tasks makes a man healthy, wealthy, and wise. I added 'fly kite in thunderstorm' as a task and the rest is history. Highly recommend!",
		rating: 5,
	},
];

export function TestimonialsSection() {
	return (
		<section
			id="testimonials"
			className="w-full py-24 relative overflow-hidden bg-background"
		>
			{/* Background Elements */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl opacity-50 pointer-events-none">
				<div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-[120px]"></div>
				<div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-purple-500/10 to-transparent rounded-full blur-[120px]"></div>
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<FadeIn>
					<div className="flex flex-col items-center text-center mb-20">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-bold uppercase tracking-wide mb-6 border border-yellow-500/20">
							<Skull className="h-3 w-3" />
							Totally Real Reviews*
						</div>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-6xl mb-6 text-foreground">
							What History's{" "}
							<span className="text-gradient-primary">Greatest</span> Say
						</h2>
						<p className="text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
							*These are obviously not real reviews. We just launched and don't
							have testimonials yet. But if these legends could use Day Done,
							here's what they might say.
						</p>
					</div>
				</FadeIn>

				{/* Masonry-ish Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
					{testimonials.map((testimonial, index) => (
						<FadeIn
							key={index}
							delay={index * 100}
							className={`h-full ${index === 1 || index === 4 ? "lg:translate-y-8" : ""}`}
						>
							<div className="bg-card/40 backdrop-blur-sm border border-border p-8 rounded-2xl h-full flex flex-col relative group hover:bg-card/60 transition-colors">
								{/* Quote Icon Background */}
								<div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
									<Quote className="h-16 w-16 text-primary rotate-12" />
								</div>

								<div className="flex gap-1 mb-6">
									{[...Array(testimonial.rating)].map((_, i) => (
										<Star
											key={i}
											className="h-4 w-4 fill-yellow-500 text-yellow-500"
										/>
									))}
								</div>

								<p className="text-foreground/90 mb-8 text-lg leading-relaxed relative z-10 font-medium">
									"{testimonial.quote}"
								</p>

								<div className="mt-auto flex items-center gap-4 border-t border-border pt-6">
									<div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-lg">
										{testimonial.image}
									</div>
									<div>
										<div className="font-bold text-foreground text-sm">
											{testimonial.name}
										</div>
										<div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
											{testimonial.role}
										</div>
									</div>
								</div>

								{/* Achievement Badge */}
								<div className="absolute -bottom-3 right-6 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
									{testimonial.badge}
								</div>
							</div>
						</FadeIn>
					))}
				</div>
			</div>
		</section>
	);
}
