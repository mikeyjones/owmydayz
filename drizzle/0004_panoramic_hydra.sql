CREATE TABLE "kanban_item_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_item_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "kanban_item_comment" ADD CONSTRAINT "kanban_item_comment_item_id_kanban_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."kanban_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_item_comment" ADD CONSTRAINT "kanban_item_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_item_comment" ADD CONSTRAINT "team_item_comment_item_id_team_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."team_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_item_comment" ADD CONSTRAINT "team_item_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_kanban_item_comment_item_id" ON "kanban_item_comment" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_kanban_item_comment_user_id" ON "kanban_item_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_kanban_item_comment_parent_id" ON "kanban_item_comment" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "idx_team_item_comment_item_id" ON "team_item_comment" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_team_item_comment_user_id" ON "team_item_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_team_item_comment_parent_id" ON "team_item_comment" USING btree ("parent_comment_id");