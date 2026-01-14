CREATE TABLE "kanban_board" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_column" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_system" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_item" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"importance" text DEFAULT 'medium' NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"tags" text[] DEFAULT '{}',
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kanban_board" ADD CONSTRAINT "kanban_board_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_column" ADD CONSTRAINT "kanban_column_board_id_kanban_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_item" ADD CONSTRAINT "kanban_item_column_id_kanban_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."kanban_column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_item" ADD CONSTRAINT "kanban_item_board_id_kanban_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_kanban_board_user_id" ON "kanban_board" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_kanban_column_board_id" ON "kanban_column" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "idx_kanban_item_column_id" ON "kanban_item" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "idx_kanban_item_board_id" ON "kanban_item" USING btree ("board_id");