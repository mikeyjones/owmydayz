import type { ErrorComponentProps } from "@tanstack/react-router";
import {
	ErrorComponent,
	Link,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
	const router = useRouter();
	const routerState = useRouterState();

	const isAuthPage = ["/sign-in", "/sign-up"].includes(
		routerState.location.pathname,
	);

	console.error("DefaultCatchBoundary triggered:", error);
	console.log("Current route:", routerState.location.pathname);
	console.log("Is auth page:", isAuthPage);

	return (
		<div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
			<ErrorComponent error={error} />
			<div className="flex gap-2 items-center flex-wrap">
				<Button
					onClick={() => {
						router.invalidate();
					}}
				>
					Try Again
				</Button>
				{isAuthPage ? (
					<Button asChild>
						<Link to="/">Home</Link>
					</Button>
				) : (
					<Button asChild>
						<Link to="/dashboard">Dashboard</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
