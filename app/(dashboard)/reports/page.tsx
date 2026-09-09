"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReport } from "@/hooks/use-crm";
import { formatINR, titleCase } from "@/lib/utils";

const TABS = [
  { key: "sources", label: "Lead Sources" },
  { key: "advisors", label: "Advisors" },
  { key: "funnel", label: "Funnel" },
  { key: "pipeline", label: "Pipeline" },
  { key: "operators", label: "Operators" },
  { key: "revenue", label: "Revenue" },
  { key: "demand", label: "Demand" },
  { key: "lost", label: "Lost Deals" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState("sources");
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Where enquiries come from, how they convert, and what they earn."
      />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={TABS} />
      <ReportView name={tab} />
    </div>
  );
}

function ReportView({ name }: { name: string }) {
  const { data, isLoading } = useReport(name);
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading report…</p>;
  const d = data?.data;
  if (!d) return <p className="text-sm text-muted-foreground">No data.</p>;

  if (name === "sources") return <SourcesReport rows={d} />;
  if (name === "advisors") return <AdvisorsReport rows={d} />;
  if (name === "funnel") return <FunnelReport rows={d} />;
  if (name === "pipeline") return <PipelineReport rows={d} />;
  if (name === "operators") return <OperatorsReport rows={d} />;
  if (name === "revenue") return <RevenueReport data={d} />;
  if (name === "demand") return <DemandReport data={d} />;
  if (name === "lost") return <LostReport data={d} />;
  return null;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SourcesReport({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-4">
      <ChartCard title="Enquiries vs. wins by source">
        <BarChart data={rows.map((r) => ({ ...r, source: titleCase(r.source) }))}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="source" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="enquiries" fill="#93c5fd" name="Enquiries" />
          <Bar dataKey="won" fill="#22c55e" name="Won" />
        </BarChart>
      </ChartCard>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Enquiries</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Conv %</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.source}>
                  <TableCell>{titleCase(r.source)}</TableCell>
                  <TableCell className="text-right">{r.enquiries}</TableCell>
                  <TableCell className="text-right">{r.won}</TableCell>
                  <TableCell className="text-right">{r.conversionPct}%</TableCell>
                  <TableCell className="text-right">
                    {formatINR(r.commission, { short: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AdvisorsReport({ rows }: { rows: any[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Advisor</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">Shortlists</TableHead>
              <TableHead className="text-right">Visits done</TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">Conv %</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.advisor}>
                <TableCell className="font-medium">{r.advisor}</TableCell>
                <TableCell className="text-right">{r.assigned}</TableCell>
                <TableCell className="text-right">{r.shortlists}</TableCell>
                <TableCell className="text-right">{r.visitsDone}</TableCell>
                <TableCell className="text-right">{r.won}</TableCell>
                <TableCell className="text-right">{r.conversionPct}%</TableCell>
                <TableCell className="text-right">
                  {formatINR(r.revenue, { short: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FunnelReport({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-4">
      <ChartCard title="Reached each stage">
        <BarChart
          layout="vertical"
          data={rows.map((r) => ({ ...r, stage: titleCase(r.stage) }))}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="reached" fill="#3b82f6" name="Reached" />
        </BarChart>
      </ChartCard>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">At stage now</TableHead>
                <TableHead className="text-right">Ever reached</TableHead>
                <TableHead className="text-right">Drop-off %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.stage}>
                  <TableCell>{titleCase(r.stage)}</TableCell>
                  <TableCell className="text-right">{r.atStage}</TableCell>
                  <TableCell className="text-right">{r.reached}</TableCell>
                  <TableCell className="text-right">{r.dropOffPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineReport({ rows }: { rows: any[] }) {
  return (
    <ChartCard title="Pipeline value by stage (₹/mo)">
      <BarChart data={rows.map((r) => ({ ...r, stage: titleCase(r.stage) }))}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatINR(v)} />
        <Bar dataKey="value" fill="#6366f1" name="Value" />
      </BarChart>
    </ChartCard>
  );
}

function OperatorsReport({ rows }: { rows: any[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operator</TableHead>
              <TableHead className="text-right">Spaces</TableHead>
              <TableHead className="text-right">Times shortlisted</TableHead>
              <TableHead className="text-right">Deals won</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.operator}>
                <TableCell className="font-medium">{r.operator}</TableCell>
                <TableCell className="text-right">{r.spaces}</TableCell>
                <TableCell className="text-right">{r.timesShortlisted}</TableCell>
                <TableCell className="text-right">{r.dealsWon}</TableCell>
                <TableCell className="text-right">
                  {formatINR(r.revenue, { short: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RevenueReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        YTD commission booked: <strong>{formatINR(data.ytd)}</strong>
      </p>
      <ChartCard title="Commission by month">
        <LineChart data={data.months}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatINR(v)} />
          <Legend />
          <Line dataKey="pipeline" stroke="#f59e0b" name="Pending" />
          <Line dataKey="invoiced" stroke="#3b82f6" name="Invoiced" />
          <Line dataKey="received" stroke="#22c55e" name="Received" />
        </LineChart>
      </ChartCard>
    </div>
  );
}

function DemandReport({ data }: { data: any }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="By workspace type">
        <BarChart data={data.byType.map((r: any) => ({ ...r, type: titleCase(r.type) }))}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" />
        </BarChart>
      </ChartCard>
      <ChartCard title="By seat range">
        <BarChart data={data.bySeats}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="range" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#0ea5e9" />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function LostReport({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {data.total} lost deals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.byReason.map((r: any) => (
          <div key={r.reason} className="flex items-center gap-3">
            <span className="w-40 text-sm">{titleCase(r.reason)}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${
                    data.total ? (r.count / data.total) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <span className="w-8 text-right text-sm">{r.count}</span>
          </div>
        ))}
        {data.total === 0 && (
          <p className="text-sm text-muted-foreground">No lost deals 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}
