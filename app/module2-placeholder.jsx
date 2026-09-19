'use client';

import Navigation from './components/common/Navigation';

export default function Module2Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Module 2 - Flight Status</h1>
          <p className="text-gray-600">Real-time flight monitoring - Coming Soon</p>
        </div>
      </main>
    </div>
  );
}
