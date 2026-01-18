import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

interface BreadcrumbItemData {
	label: string;
	href?: string;
	search?: Record<string, unknown>;
	icon?: React.ComponentType<{ className?: string }>;
}

interface AppBreadcrumbProps {
	items: BreadcrumbItemData[];
}

export function AppBreadcrumb({ items }: AppBreadcrumbProps) {
	if (!items || items.length === 0) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<div key={`${item.label}-${index}`} className="flex items-center">
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage className="flex items-center gap-2">
										{item.icon && <item.icon className="h-4 w-4" />}
										{item.label}
									</BreadcrumbPage>
								) : item.href ? (
									<BreadcrumbLink asChild>
										<Link
											to={item.href}
											search={item.search as never}
											className="flex items-center gap-2"
										>
											{item.icon && <item.icon className="h-4 w-4" />}
											{item.label}
										</Link>
									</BreadcrumbLink>
								) : (
									<span className="flex items-center gap-2">
										{item.icon && <item.icon className="h-4 w-4" />}
										{item.label}
									</span>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</div>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
