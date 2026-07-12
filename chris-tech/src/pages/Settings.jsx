import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Settings() {
  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[28px] border border-slate-800 bg-slate-900/80 p-10 shadow-glow">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Manage your Chris Tech preferences, security, and Deriv integration settings from one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-white">Account Integration</h2>
            <p className="mt-3 text-slate-400">
              Configure your Deriv connection, refresh tokens, and secure session settings.
            </p>
            <Button className="mt-6" variant="secondary">
              Manage Connection
            </Button>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
            <p className="mt-3 text-slate-400">
              Enable alerts for account events, chart updates, and websocket connection changes.
            </p>
            <Button className="mt-6" variant="secondary">
              Update Preferences
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
