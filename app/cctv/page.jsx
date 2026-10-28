import Navigation from '../components/common/Navigation';

const CHECKS = [
  ['PC mapping', 'Pending', 'Assign each workstation to its camera view and seat area.'],
  ['Long idle review', 'Planned · 60 minutes', 'Request a camera review after a sustained idle period.'],
  ['Camera AI', 'Not connected', 'Camera snapshots and AI assessment will be connected after mapping is verified.'],
];
const VIEWS = ['Operations 1', 'Operations 2', 'Custom Clearance'];

export default function CCTVPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">CCTV Review</h1>
            <p className="text-gray-600">Review workstation presence alongside PC idle activity.</p>
          </div>
          <span className="badge-warning">Setup pending</span>
        </div>
        <div className="card border-l-4 border-amber-500 mb-6">
          <h2 className="font-semibold text-gray-900">Camera automation is not active yet</h2>
          <p className="text-sm text-gray-600 mt-2">This page is ready for setup. It does not show live camera results or send camera-based alerts.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {CHECKS.map(([title, status, description]) => (
            <section className="card" key={title}>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-sm font-medium text-amber-700 mt-2">{status}</p>
              <p className="text-sm text-gray-600 mt-3">{description}</p>
            </section>
          ))}
        </div>
        <section className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workstation mapping</h2>
          <div className="divide-y divide-gray-100">
            {VIEWS.map(name => (
              <div className="flex flex-wrap items-center justify-between gap-2 py-3" key={name}>
                <p className="font-medium text-gray-900">{name}</p>
                <p className="text-sm text-gray-500">PC and seat mapping pending</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">A workstation visible in two cameras will use one PC identity after mapping.</p>
        </section>
        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Camera reviews</h2>
          <p className="text-gray-600">No camera reviews available.</p>
          <p className="text-sm text-gray-500 mt-2">Once connected, reviews will distinguish person visible, no person visible, and unclear view. Unclear results will need review.</p>
        </section>
      </main>
    </div>
  );
}
