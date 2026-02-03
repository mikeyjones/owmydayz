import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";

const resetSchema = z
	.object({
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(6, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type ResetForm = z.infer<typeof resetSchema>;

type ResetSearch = {
	token?: string;
	error?: string;
};

export const Route = createFileRoute("/reset-password")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>): ResetSearch => ({
		token: typeof search.token === "string" ? search.token : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
});

function RouteComponent() {
	const { token, error } = Route.useSearch();
	const [isLoading, setIsLoading] = useState(false);
	const [authError, setAuthError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const form = useForm<ResetForm>({
		resolver: zodResolver(resetSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const errorMessage = useMemo(() => {
		if (error === "INVALID_TOKEN") {
			return "This reset link is invalid or expired. Please request a new one.";
		}
		return "";
	}, [error]);

	const onSubmit = async (data: ResetForm) => {
		setIsLoading(true);
		setAuthError("");

		if (!token) {
			setAuthError("Missing reset token. Please request a new reset link.");
			setIsLoading(false);
			return;
		}

		try {
			const result = await authClient.resetPassword({
				newPassword: data.password,
				token,
			});

			if (result.error) {
				setAuthError(result.error.message || "Unable to reset password");
				return;
			}

			setIsSuccess(true);
		} catch (_error) {
			setAuthError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container mx-auto relative min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
			<aside
				className="relative hidden h-full flex-col bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-12 text-slate-800 dark:text-white lg:flex border-r border-border overflow-hidden"
				aria-label="SoundStation password reset"
			>
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 via-teal-600/6 to-emerald-600/4 dark:from-emerald-600/6 dark:to-teal-600/4" />
				<div className="absolute top-32 right-32 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-400/10 dark:from-emerald-400/12 dark:to-teal-400/8 blur-2xl animate-pulse" />
				<div className="absolute bottom-32 left-32 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/10 to-emerald-400/8 dark:from-teal-400/8 dark:to-emerald-400/6 blur-xl" />

				<header className="relative z-20 flex items-center text-xl font-semibold">
					<div
						className="mr-4 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/20 p-3 backdrop-blur-sm border border-emerald-200/30 dark:border-white/20 shadow-lg"
						aria-hidden="true"
					>
						<LockKeyhole className="h-6 w-6 text-emerald-600 dark:text-emerald-200" />
					</div>
					<h1 className="bg-gradient-to-r from-slate-800 via-emerald-700 to-teal-700 dark:from-white dark:via-emerald-50 dark:to-teal-50 bg-clip-text text-transparent font-bold">
						SoundStation
					</h1>
				</header>

				<main className="relative z-20 flex-1 flex flex-col justify-center">
					<div className="space-y-6 text-center">
						<h2 className="text-4xl font-bold leading-tight bg-gradient-to-r from-slate-800 via-emerald-700 to-teal-700 dark:from-white dark:via-emerald-50 dark:to-teal-50 bg-clip-text text-transparent">
							Set a new password
						</h2>
						<p className="text-slate-600 dark:text-slate-300 text-lg opacity-75">
							Choose a strong password to secure your account.
						</p>
					</div>
				</main>
			</aside>
			<div className="lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight animate-fadeInUp">
							Reset your password
						</h1>
						<p className="text-sm text-muted-foreground animate-fadeInUp animation-delay-100">
							Enter a new password for your account.
						</p>
					</div>
					<div className="grid gap-6">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)}>
								<div className="grid gap-4">
									{errorMessage && (
										<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
											<p className="text-sm text-destructive">{errorMessage}</p>
										</div>
									)}
									{authError && (
										<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
											<p className="text-sm text-destructive">{authError}</p>
										</div>
									)}
									{isSuccess && (
										<div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
											<p className="text-sm text-emerald-700 dark:text-emerald-300">
												Your password has been reset. You can sign in now.
											</p>
										</div>
									)}
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>New password</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter a new password"
														type="password"
														autoComplete="new-password"
														disabled={isLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm password</FormLabel>
												<FormControl>
													<Input
														placeholder="Re-enter your new password"
														type="password"
														autoComplete="new-password"
														disabled={isLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										disabled={isLoading}
										type="submit"
										className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium"
									>
										{isLoading && (
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
										)}
										{isLoading ? "Updating..." : "Reset password"}
									</Button>
								</div>
							</form>
						</Form>
						<div className="text-center text-sm text-muted-foreground">
							<Link
								to="/sign-in"
								className="underline underline-offset-4 hover:text-primary"
							>
								Return to sign in
							</Link>
							{" "}or{" "}
							<Link
								to="/forgot-password"
								className="underline underline-offset-4 hover:text-primary"
							>
								request a new link
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
