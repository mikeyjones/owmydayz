import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
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

const requestSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type RequestForm = z.infer<typeof requestSchema>;

export const Route = createFileRoute("/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isSent, setIsSent] = useState(false);

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RequestForm) => {
    setIsLoading(true);
    setAuthError("");
    setIsSent(false);

    try {
      const redirectTo = new URL(
        "/reset-password",
        window.location.origin
      ).toString();
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo,
      });

      if (result.error) {
        setAuthError(result.error.message || "Unable to send reset email");
        return;
      }

      setIsSent(true);
    } catch (_error) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto relative min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <aside
        className="relative hidden h-full flex-col bg-linear-to-br from-amber-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 p-12 text-slate-800 dark:text-white lg:flex border-r border-border overflow-hidden"
        aria-label="Day Done password recovery"
      >
        <div className="absolute inset-0 bg-linear-to-br from-rose-600/8 via-amber-600/6 to-rose-600/4 dark:from-rose-600/6 dark:to-amber-600/4" />
        <div className="absolute top-32 right-32 h-48 w-48 rounded-full bg-linear-to-br from-rose-400/15 to-amber-400/10 dark:from-rose-400/12 dark:to-amber-400/8 blur-2xl animate-pulse" />
        <div className="absolute bottom-32 left-32 h-32 w-32 rounded-full bg-linear-to-br from-amber-400/10 to-rose-400/8 dark:from-amber-400/8 dark:to-rose-400/6 blur-xl" />

        <header className="relative z-20 flex items-center text-xl font-semibold">
          <div
            className="mr-4 rounded-xl bg-linear-to-br from-rose-500/25 to-amber-500/20 p-3 backdrop-blur-sm border border-rose-200/30 dark:border-white/20 shadow-lg"
            aria-hidden="true"
          >
            <ShieldCheck className="h-6 w-6 text-rose-600 dark:text-rose-200" />
          </div>
          <h1 className="bg-linear-to-r from-slate-800 via-rose-700 to-amber-700 dark:from-white dark:via-rose-50 dark:to-amber-50 bg-clip-text text-transparent font-bold">
            Day Done
          </h1>
        </header>

        <main className="relative z-20 flex-1 flex flex-col justify-center">
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold leading-tight bg-linear-to-r from-slate-800 via-rose-700 to-amber-700 dark:from-white dark:via-rose-50 dark:to-amber-50 bg-clip-text text-transparent">
              Recover your access
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg opacity-75">
              We will email a secure link to reset your password.
            </p>
          </div>
        </main>
      </aside>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight animate-fadeInUp">
              Forgot your password?
            </h1>
            <p className="text-sm text-muted-foreground animate-fadeInUp animation-delay-100">
              Enter your email to receive a reset link.
            </p>
          </div>
          <div className="grid gap-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                  {authError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{authError}</p>
                    </div>
                  )}
                  {isSent && (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        If this email exists in our system, you will receive a
                        reset link shortly.
                      </p>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
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
                    className="w-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium"
                  >
                    {isLoading && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    )}
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </div>
              </form>
            </Form>
            <div className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link
                to="/sign-in"
                search={{ redirect: undefined }}
                className="underline underline-offset-4 hover:text-primary"
              >
                Back to sign in
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>Check your inbox for the reset link.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
