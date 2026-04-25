import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-brand-500">NeuroLift</span>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
            Dashboard
          </Link>
          <Link href="/simulation" className="text-gray-400 hover:text-white transition-colors text-sm">
            Simulation
          </Link>
          <Link href="/auth/login" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            AI-Powered ADHD{' '}
            <span className="text-brand-500">Coaching & Simulation</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience an immersive simulation environment where AI avatars learn,
            grow, and receive real-time coaching tailored to ADHD traits.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/simulation" className="btn-primary text-base px-8 py-3">
            Launch Simulation
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-8 py-3 rounded-lg transition-colors text-base"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Avatar System',
              desc: 'ADHD trait avatars that authentically experience scenarios and grow through interaction.',
            },
            {
              title: 'AI Aide Coaching',
              desc: 'Real-time coaching from specialized AI aides with expertise in attention and executive function.',
            },
            {
              title: 'Advocate Fusion',
              desc: 'Advocate engine combines avatar experience with aide expertise for personalized insights.',
            },
          ].map((f) => (
            <div key={f.title} className="card">
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
