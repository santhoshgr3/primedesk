"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserX, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, useTeam } from "@/hooks/use-crm";
import { formatINR, titleCase } from "@/lib/utils";
import { CITIES } from "@/lib/constants";

export default function TeamPage() {
  const [tab, setTab] = useState("members");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Team"
        description="Advisors, operations and admins — plus monthly targets."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add member
          </Button>
        }
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "members", label: "Members" },
          { key: "targets", label: "Targets & Leaderboard" },
        ]}
      />
      {tab === "members" ? <Members /> : <Targets />}
      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function Members() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const { data: users, isLoading } = useTeam();

  async function toggle(id: string, isActive: boolean) {
    if (isActive) {
      const ok = await confirm({
        title: "Deactivate this member?",
        body: "They lose access immediately and their open enquiries are auto-reassigned.",
        confirmText: "Deactivate",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      const res = await api.jsonFetch<any>(`/api/team/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      qc.invalidateQueries({ queryKey: ["team"] });
      toast({
        title: !isActive ? "Reactivated" : "Deactivated",
        description: res.reassigned
          ? `${res.reassigned} enquiries reassigned`
          : undefined,
        variant: "success",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {users?.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{titleCase(u.role)}</TableCell>
                <TableCell>{u.city ?? "—"}</TableCell>
                <TableCell>
                  {u.isActive ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggle(u.id, u.isActive)}
                  >
                    {u.isActive ? (
                      <>
                        <UserX className="size-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-4" /> Reactivate
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Targets() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const month = new Date().toISOString().slice(0, 7);
  const { data: advisors } = useTeam();
  const { data: targets } = useQuery({
    queryKey: ["targets", month],
    queryFn: () => api.jsonFetch<any[]>(`/api/targets?month=${month}`),
  });
  const [editing, setEditing] = useState<any>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch("/api/targets", {
        method: "POST",
        body: JSON.stringify({
          advisorId: fd.get("advisorId"),
          month,
          shortlistsGoal: fd.get("shortlistsGoal"),
          visitsGoal: fd.get("visitsGoal"),
          dealsGoal: fd.get("dealsGoal"),
          revenueGoal: fd.get("revenueGoal"),
        }),
      });
      qc.invalidateQueries({ queryKey: ["targets", month] });
      toast({ title: "Target saved", variant: "success" });
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    }
  }

  const advisorOptions = (advisors ?? []).filter(
    (a: any) => a.role === "ADVISOR" || a.role === "OPERATIONS",
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Month: {month}</p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advisor</TableHead>
                <TableHead className="text-right">Shortlists</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No targets set for {month}.
                  </TableCell>
                </TableRow>
              )}
              {targets?.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.advisor.name}</TableCell>
                  <Cell actual={t.actual.shortlists} goal={t.shortlistsGoal} />
                  <Cell actual={t.actual.visits} goal={t.visitsGoal} />
                  <Cell actual={t.actual.deals} goal={t.dealsGoal} />
                  <TableCell className="text-right">
                    <span
                      className={
                        t.actual.revenue >= t.revenueGoal && t.revenueGoal > 0
                          ? "font-medium text-green-600"
                          : ""
                      }
                    >
                      {formatINR(t.actual.revenue, { short: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      / {formatINR(t.revenueGoal, { short: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => setEditing({})}>
        + Set / update a target
      </Button>

      {editing && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Advisor</Label>
                <Select name="advisorId" required placeholder="Select advisor">
                  {advisorOptions.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shortlists goal</Label>
                <Input name="shortlistsGoal" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1.5">
                <Label>Visits goal</Label>
                <Input name="visitsGoal" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1.5">
                <Label>Deals goal</Label>
                <Input name="dealsGoal" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1.5">
                <Label>Revenue goal (₹)</Label>
                <Input name="revenueGoal" type="number" min={0} defaultValue={0} />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save target</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Cell({ actual, goal }: { actual: number; goal: number }) {
  const hit = goal > 0 && actual >= goal;
  return (
    <TableCell className="text-right">
      <span className={hit ? "font-medium text-green-600" : ""}>{actual}</span>
      <span className="text-xs text-muted-foreground"> / {goal}</span>
    </TableCell>
  );
}

function AddMemberDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch("/api/team", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || undefined,
          role: fd.get("role"),
          city: fd.get("city") || undefined,
          password: fd.get("password"),
        }),
      });
      qc.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "Member added", variant: "success" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add team member">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input name="phone" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue="ADVISOR">
              <option value="ADVISOR">Advisor</option>
              <option value="OPERATIONS">Operations</option>
              <option value="MARKETING">Marketing</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select name="city" placeholder="—">
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Temp password *</Label>
            <Input name="password" type="text" minLength={8} required defaultValue="Welcome@123" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add member"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
