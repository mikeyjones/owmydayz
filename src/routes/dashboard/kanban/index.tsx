import { createFileRoute } from "@tanstack/react-router";
import { BoardList } from "~/components/kanban/BoardList";

export const Route = createFileRoute("/dashboard/kanban/")({
  component: KanbanIndex,
});

function KanbanIndex() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <BoardList />
    </div>
  );
}
