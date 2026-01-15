ALTER TABLE "kanban_board" ADD COLUMN "focus_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "team_board" ADD COLUMN "focus_mode" boolean DEFAULT false NOT NULL;