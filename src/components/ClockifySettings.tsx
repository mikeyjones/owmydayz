import { Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useClockifyConnection,
	useConnectClockify,
	useDisconnectClockify,
} from "~/hooks/useClockify";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./ui/panel";

/**
 * Clockify integration settings component.
 * Shows connection status and allows connecting/disconnecting Clockify workspace.
 */
export function ClockifySettings() {
	const [apiKey, setApiKey] = useState("");
	const [isConnecting, setIsConnecting] = useState(false);

	const {
		data: connections,
		isLoading,
		isConnected,
		activeWorkspace,
	} = useClockifyConnection();
	const connectClockify = useConnectClockify();
	const disconnectClockify = useDisconnectClockify();

	const handleConnect = async () => {
		if (!apiKey.trim()) {
			toast.error("Please enter your Clockify API key");
			return;
		}

		setIsConnecting(true);
		connectClockify.mutate(apiKey, {
			onSuccess: () => {
				setApiKey(""); // Clear the input after successful connection
				setIsConnecting(false);
			},
			onError: () => {
				setIsConnecting(false);
			},
		});
	};

	const handleDisconnect = () => {
		if (!activeWorkspace?.workspaceId) return;

		disconnectClockify.mutate(activeWorkspace.workspaceId, {
			onSuccess: () => {
				// Success toast is shown by the hook
			},
		});
	};

	return (
		<Panel>
			<PanelHeader>
				<PanelTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					Clockify Integration
				</PanelTitle>
			</PanelHeader>
			<PanelContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Connect your Clockify account to automatically track time on kanban
					items.
				</p>

				{isLoading ? (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
						Loading connection status...
					</div>
				) : isConnected && activeWorkspace ? (
					<div className="space-y-3">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500" />
									<span className="text-sm font-medium">Connected</span>
								</div>
								<p className="text-sm text-muted-foreground">
									Workspace: {activeWorkspace.workspaceName}
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDisconnect}
								disabled={disconnectClockify.isPending}
							>
								{disconnectClockify.isPending
									? "Disconnecting..."
									: "Disconnect"}
							</Button>
						</div>

						{connections && connections.length > 1 && (
							<p className="text-xs text-muted-foreground">
								{connections.length - 1} other workspace
								{connections.length > 2 ? "s" : ""} connected
							</p>
						)}
					</div>
				) : (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-gray-400" />
							<span className="text-sm font-medium">Not Connected</span>
						</div>

						<div className="space-y-2">
							<Label htmlFor="clockify-api-key">Clockify API Key</Label>
							<Input
								id="clockify-api-key"
								type="password"
								placeholder="Enter your Clockify API key"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								disabled={isConnecting}
							/>
							<p className="text-xs text-muted-foreground">
								Get your API key from{" "}
								<a
									href="https://app.clockify.me/user/settings"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Clockify Settings → Profile Settings → API
								</a>
							</p>
						</div>

						<Button
							onClick={handleConnect}
							size="sm"
							disabled={isConnecting || !apiKey.trim()}
						>
							{isConnecting ? "Connecting..." : "Connect Clockify"}
						</Button>
					</div>
				)}
			</PanelContent>
		</Panel>
	);
}
