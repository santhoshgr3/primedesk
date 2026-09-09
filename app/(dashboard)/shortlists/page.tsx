"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShortlists } from "@/hooks/use-crm";
import { timeAgo, titleCase } from "@/lib/utils";

const RESPONSE_META: Record<string, string> = {
  wants_visit: "bg-cyan-100 text-cyan-700",
  interested_in_X: "bg-green-100 text-green-700",
  not_suitable: "bg-red-100 text-red-700",
  no_response: "bg-gray-100 text-gray-600",
};

export default function ShortlistsPage() {
  const { data, isLoading } = useShortlists();

  return (
    <div>
      <PageHeader
        title="Shortlists"
        description="Every curated shortlist sent to a client, with response tracking."
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Spaces</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Via</TableHead>
              <TableHead>Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {data?.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No shortlists yet. Open an enquiry and click “Build Shortlist”.
                </TableCell>
              </TableRow>
            )}
            {data?.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/shortlists/${s.id}`} className="flex items-center gap-2 font-medium hover:underline">
                    <FileText className="size-4 text-muted-foreground" />
                    {s.enquiry.companyName}
                  </Link>
                </TableCell>
                <TableCell>v{s.version}</TableCell>
                <TableCell>{s.items.length}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.advisor.name}</TableCell>
                <TableCell className="text-xs">
                  {s.sentAt ? timeAgo(s.sentAt) : <span className="text-amber-600">draft</span>}
                </TableCell>
                <TableCell className="text-xs">{s.sentVia?.join(", ") || "—"}</TableCell>
                <TableCell>
                  {s.response ? (
                    <Badge className={RESPONSE_META[s.response]}>
                      {titleCase(s.response)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">awaiting</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
