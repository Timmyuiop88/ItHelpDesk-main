import { AlertTriangle, CheckCircle2, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "../../components/common/RefreshButton";
import {
  clearManualRustdeskId,
  getManualRustdeskId,
  setManualRustdeskId,
} from "../../api/deviceStore";
import { useDeviceAgentState } from "../../components/DeviceAgentContext";
import { DeviceIssueNotice } from "../../components/devices/DeviceIssueNotice";
import { DeviceStatusBadge } from "../../components/devices/DeviceStatusBadge";
import { MyDevicesCard } from "../../components/devices/MyDevicesCard";
import { useMyDevices } from "../../hooks/devices/useMyDevices";

export function DevicesPage() {
  const agent = useDeviceAgentState();
  const device = agent.device;
  const myDevices = useMyDevices();

  const handleRefresh = async () => {
    await myDevices.refetch();
    agent.reregister();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">This device</h1>
        <RefreshButton onRefresh={handleRefresh} iconOnly />
      </div>
      {agent.isRegistering && <p className="text-sm">Registering device...</p>}
      <DeviceIssueNotice />
      {device && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{device.hostname || "Registered device"}</CardTitle>
            <DeviceStatusBadge device={device} />
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>Operating system: {device.operatingSystem || "—"}</p>
            <p>Serial: {device.serialNumber || "—"}</p>
            <p>Agent: {device.agentVersion || "—"}</p>
          </CardContent>
        </Card>
      )}
      {device && <RustdeskIdCard />}
      <MyDevicesCard />
    </div>
  );
}

function RustdeskIdCard() {
  const agent = useDeviceAgentState();
  const currentId = agent.device?.rustdeskId ?? "";
  const [manualId, setManualId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getManualRustdeskId().then(setManualId);
  }, [currentId]);

  const startEditing = () => {
    setValue(currentId);
    setEditing(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = value.replace(/\s+/g, "");
    if (!/^\d{6,12}$/.test(id)) {
      toast.error("That doesn't look like a RustDesk ID", {
        description: "It should be 6–12 digits, e.g. 123 456 789.",
      });
      return;
    }

    setSaving(true);
    await setManualRustdeskId(id);
    setManualId(id);
    setSaving(false);
    setEditing(false);
    agent.reregister();
    toast.success("RustDesk ID saved");
  };

  const switchToDetected = async () => {
    await clearManualRustdeskId();
    setManualId(null);
    agent.reregister();
    toast.message("Detecting RustDesk ID…");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>RustDesk ID</CardTitle>
        <CardDescription>
          IT Support uses this ID to connect to your screen after you approve a request.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!editing && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
            {currentId ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary" />
                <div>
                  <p className="font-mono text-lg font-semibold tracking-wider">
                    {currentId.replace(/(\d{3})(?=\d)/g, "$1 ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {manualId ? "Entered manually" : "Detected automatically"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600" />
                <div>
                  <p className="font-medium">Not set</p>
                  <p className="text-xs text-muted-foreground">
                    Remote support won't work until this is added.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant={currentId ? "outline" : "default"} onClick={startEditing}>
                <Pencil />
                {currentId ? "Change" : "Add ID"}
              </Button>
              {manualId && (
                <Button variant="ghost" onClick={() => void switchToDetected()} disabled={agent.isRegistering}>
                  {agent.isRegistering ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  Detect automatically
                </Button>
              )}
            </div>
          </div>
        )}

        {editing && (
          <form className="flex flex-col gap-3" onSubmit={(event) => void handleSave(event)}>
            <Label htmlFor="rustdesk-id">Your RustDesk ID</Label>
            <Input
              id="rustdesk-id"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="123 456 789"
              inputMode="numeric"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
          <li>Open the RustDesk app on this computer.</li>
          <li>
            Copy the number shown under <span className="font-medium text-foreground">“Your Desktop” → ID</span>.
          </li>
          <li>Paste it here and save. Leave RustDesk running in the background.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
