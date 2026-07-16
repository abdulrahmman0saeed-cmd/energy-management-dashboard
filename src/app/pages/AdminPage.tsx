import { Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useApp } from "../context/AppContext";
import type { UserRole } from "../types";

const ROLE_BADGE: Record<UserRole, string> = {
  Admin:            "bg-purple-50 text-purple-800 border-purple-200",
  "Maintenance Team": "bg-blue-50   text-blue-800   border-blue-200",
  "Storage Team":     "bg-amber-50  text-amber-800  border-amber-200",
};

const ROLE_ICON_BG: Record<UserRole, string> = {
  Admin:            "bg-purple-100",
  "Maintenance Team": "bg-blue-100",
  "Storage Team":     "bg-amber-100",
};

const ROLE_ICON_COLOR: Record<UserRole, string> = {
  Admin:            "text-purple-700",
  "Maintenance Team": "text-blue-700",
  "Storage Team":     "text-amber-700",
};

export function AdminPage() {
  const { state, dispatch } = useApp();

  const countByRole = (role: UserRole) => state.users.filter(u => u.role === role).length;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage user accounts and role-based access permissions</p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["Admin", "Maintenance Team", "Storage Team"] as UserRole[]).map(role => (
          <Card key={role}>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ROLE_ICON_BG[role]}`}>
                <Users className={`w-5 h-5 ${ROLE_ICON_COLOR[role]}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{role}</p>
                <p className="text-2xl font-bold text-foreground">{countByRole(role)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {countByRole(role) === 1 ? "user" : "users"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> User Privileges
            <Badge variant="secondary" className="ml-auto">{state.users.length} users</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {user.initials}
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{user.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge className={`${ROLE_BADGE[user.role]} border text-xs font-medium`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) =>
                          dispatch({ type: "SET_USER_ROLE", payload: { userId: user.id, role: newRole as UserRole } })
                        }
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Maintenance Team">Maintenance Team</SelectItem>
                          <SelectItem value="Storage Team">Storage Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">Access Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-50 text-purple-800 border-purple-200 border text-xs">Admin</Badge>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> User management & role assignment</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Full system access</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Audit logs & reports</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-50 text-blue-800 border-blue-200 border text-xs">Maintenance Team</Badge>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Full dashboard & analytics</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Part tracking & maintenance records</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Alerts, reports, history</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 border text-xs">Storage Team</Badge>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Excel / CSV import</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-600">✓</span> Inventory search</li>
                <li className="flex items-center gap-1.5"><span className="text-red-500">✗</span> No dashboards or reports</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
