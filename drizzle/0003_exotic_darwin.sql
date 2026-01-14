CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "team_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_board" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_id" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_column" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_system" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"email" text NOT NULL,
	"invited_by" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "team_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team_item" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"importance" text DEFAULT 'medium' NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"tags" text[] DEFAULT '{}',
	"position" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_membership" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_board" ADD CONSTRAINT "team_board_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_board" ADD CONSTRAINT "team_board_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_column" ADD CONSTRAINT "team_column_board_id_team_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."team_board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_item" ADD CONSTRAINT "team_item_column_id_team_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."team_column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_item" ADD CONSTRAINT "team_item_board_id_team_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."team_board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_item" ADD CONSTRAINT "team_item_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_team_owner_id" ON "team" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_team_slug" ON "team" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_team_board_team_id" ON "team_board" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_board_created_by" ON "team_board" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_team_column_board_id" ON "team_column" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "idx_team_invitation_team_id" ON "team_invitation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_invitation_email" ON "team_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_team_invitation_token" ON "team_invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_team_item_column_id" ON "team_item" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "idx_team_item_board_id" ON "team_item" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "idx_team_item_completed_at" ON "team_item" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_team_membership_team_id" ON "team_membership" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_membership_user_id" ON "team_membership" USING btree ("user_id");