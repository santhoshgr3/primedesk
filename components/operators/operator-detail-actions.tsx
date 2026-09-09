"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { OperatorForm } from "@/components/operators/operator-form";
import { SpaceForm } from "@/components/operators/space-form";

export function OperatorSpacesActions({ operator }: { operator: any }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "edit" | "space">(null);
  const close = () => {
    setDialog(null);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setDialog("edit")}>
        <Pencil className="size-4" /> Edit
      </Button>
      <Button onClick={() => setDialog("space")}>
        <Plus className="size-4" /> Add space
      </Button>

      <Dialog open={dialog === "edit"} onClose={close} title="Edit operator">
        <OperatorForm initial={operator} onDone={close} />
      </Dialog>
      <Dialog
        open={dialog === "space"}
        onClose={close}
        title={`Add space — ${operator.name}`}
        className="max-w-2xl"
      >
        <SpaceForm operatorId={operator.id} onDone={close} />
      </Dialog>
    </div>
  );
}
