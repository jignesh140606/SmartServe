import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
} from '../../components/ui';
import {
  User,
  Mail,
  Shield,
  Bell,
  CheckCircle2,
  Lock,
  Save,
} from 'lucide-react';

export function SettingsView() {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2834');

  // Notifications
  const [notifyOnAssign, setNotifyOnAssign] = useState(true);
  const [notifyOnSLA, setNotifyOnSLA] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('Profile and notification preferences updated successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    }, 600);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setToastMessage('Error: Passwords do not match.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToastMessage('Security password updated successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Account & Platform Settings</h2>
            <Badge variant="primary" size="sm">
              {user?.role ? user.role.toUpperCase() : 'USER'} Profile
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your personal profile, notification preferences, and security credentials
          </p>
        </div>
      </div>

      {/* Action Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-status-resolved-bg border border-status-resolved-border flex items-center justify-between text-status-resolved-text text-sm shadow-soft-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-resolved-500 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold text-status-resolved-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Profile & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader border>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your contact details across SmartServe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="Email Address"
                    value={email}
                    disabled
                    leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
                    helperText="Email cannot be modified directly"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      System Role
                    </label>
                    <div className="px-3.5 py-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-sm font-medium text-neutral-700 capitalize flex items-center justify-between">
                      <span>{user?.role || 'Customer'}</span>
                      <Badge variant="primary" size="sm">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader border>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-priority-low-bg text-priority-low-text flex items-center justify-center border border-priority-low-border">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Configure which service desk events send instant alerts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Immediate Assignment Alerts</p>
                  <p className="text-xs text-neutral-500">Receive alerts when a ticket or complaint is assigned</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnAssign}
                  onChange={(e) => setNotifyOnAssign(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Critical SLA Warnings</p>
                  <p className="text-xs text-neutral-500">High-priority breach warnings for open incidents</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnSLA}
                  onChange={(e) => setNotifyOnSLA(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Weekly Performance Summary</p>
                  <p className="text-xs text-neutral-500">Receive weekly analytical report of completed tickets</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Preferences */}
        <div className="space-y-6">
          {/* Security / Password Card */}
          <Card>
            <CardHeader border>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-status-open-bg text-status-open-500 flex items-center justify-center border border-status-open-border">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Security & Password</CardTitle>
                  <CardDescription>Update your login credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                />

                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                />

                <Button
                  variant="secondary"
                  size="md"
                  type="submit"
                  className="w-full justify-center"
                  isLoading={isSaving}
                  disabled={!currentPassword || !newPassword}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
            <CardFooter border className="text-xs text-neutral-400 justify-between">
              <span>Environment: Production</span>
              <span>v1.0.0</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
