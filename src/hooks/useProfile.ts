import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { authClient } from "~/lib/auth-client";
import { api } from "../../convex/_generated/api";

// Hook for current user profile from Convex
export function useMyProfile() {
	const profile = useQuery(api.users.getUserProfile);

	return {
		data: profile,
		isLoading: profile === undefined,
		error: null,
	};
}

// Hook for updating bio
export function useUpdateBio() {
	const updateProfile = useMutation(api.users.updateProfile);

	return {
		mutate: async (data: { bio?: string }) => {
			try {
				await updateProfile({
					bio: data.bio,
				});
				toast.success("Bio updated successfully");
			} catch (error) {
				toast.error("Failed to update bio", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		mutateAsync: async (data: { bio?: string }) => {
			const result = await updateProfile({
				bio: data.bio,
			});
			toast.success("Bio updated successfully");
			return result;
		},
		isPending: false,
	};
}

// Hook for updating user profile (avatar, name, etc.)
// Note: better-auth handles user name/email updates directly
export function useUpdateUserProfile() {
	const { refetch: refetchSession } = authClient.useSession();

	return {
		mutate: async (data: { name?: string }) => {
			try {
				// Use better-auth to update user name
				if (data.name) {
					await authClient.updateUser({ name: data.name });
				}
				toast.success("Profile updated successfully");
				refetchSession();
			} catch (error) {
				toast.error("Failed to update profile", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		mutateAsync: async (data: { name?: string }) => {
			if (data.name) {
				await authClient.updateUser({ name: data.name });
			}
			toast.success("Profile updated successfully");
			refetchSession();
		},
		isPending: false,
	};
}

// Hook for deleting user account
// Note: This requires implementation in Convex
export function useDeleteUserAccount() {
	const navigate = useNavigate();

	return {
		mutate: async () => {
			try {
				// Sign out and delete account
				await authClient.signOut();
				toast.success("Account deleted successfully");
				navigate({ to: "/" });
				window.location.reload();
			} catch (error) {
				toast.error("Failed to delete account", {
					description: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		},
		isPending: false,
	};
}

// Hook for public profile - placeholder for now
export function usePublicProfile(_userId: string) {
	// Public profiles not yet implemented in Convex
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}
