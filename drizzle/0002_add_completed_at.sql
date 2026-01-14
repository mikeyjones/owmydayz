ALTER TABLE "kanban_item" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_kanban_item_completed_at" ON "kanban_item" USING btree ("completed_at");