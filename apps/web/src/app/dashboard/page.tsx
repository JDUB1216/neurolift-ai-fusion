import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/simulation" className="btn-primary">
            New Session
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sessions', value: '0' },
            { label: 'Avatars', value: '0' },
            { label: 'Achievements', value: '0' },
            { label: 'Streak', value: '0 days' },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-brand-500">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent sessions placeholder */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
          <p className="text-gray-500 text-sm">No sessions yet. Start your first simulation to see results here.</p>
        </div>
      </div>
    </div>
  )
}
