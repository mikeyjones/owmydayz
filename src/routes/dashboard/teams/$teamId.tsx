import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, Settings, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTeam } from "~/hooks/useTeams";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/teams/$teamId")({
	component: TeamLayout,
});

function TeamLayout() {
	const { teamId } = Route.useParams();
	const { data: team, isPending, error } = useTeam(teamId);
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (error || !team) {
		return (
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="text-center py-12">
					<p className="text-destructive">Team not found</p>
					<Link to="/dashboard/teams">
						<Button variant="outline" className="mt-4">
							Back to Teams
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const navItems = [
		{
			title: "Boards",
			href: `/dashboard/teams/${teamId}`,
			icon: LayoutDashboard,
			exact: true,
		},
		{
			title: "Members",
			href: `/dashboard/teams/${teamId}/members`,
			icon: Users,
		},
		{
			title: "Settings",
			href: `/dashboard/teams/${teamId}/settings`,
			icon: Settings,
		},
	];

	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Back Navigation */}
			<div className="mb-4">
				<Link to="/dashboard/teams">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Teams
					</Button>
				</Link>
			</div>

			{/* Team Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-bold">{team.name}</h1>
			</div>

			{/* Team Navigation */}
			<div className="flex gap-2 mb-6 border-b border-border pb-4">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = item.exact
						? currentPath === item.href
						: currentPath.startsWith(item.href);

					return (
						<Link key={item.href} to={item.href}>
							<Button
								variant={isActive ? "default" : "ghost"}
								size="sm"
								className={cn(!isActive && "text-muted-foreground")}
							>
								<Icon className="h-4 w-4 mr-2" />
								{item.title}
							</Button>
						</Link>
					);
				})}
			</div>

			{/* Team Content */}
			<Outlet />
		</div>
	);
}
