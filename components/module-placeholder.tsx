import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export function ModulePlaceholder({
  title,
  description,
  phase,
  bullets,
}: {
  title: string;
  description: string;
  phase: string;
  bullets: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Construction className="size-6" />
          </div>
          <div>
            <p className="font-medium">Scheduled for {phase}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Phase 1 (Foundation) is live. This module is planned next.
            </p>
          </div>
          <ul className="mt-2 space-y-1 text-left text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
