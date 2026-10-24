// src/app/dashboard/page.tsx
import { Inter } from 'next/font/google';
import { prisma } from '../../../prisma/client'; // We'll use a helper to get Prisma client at runtime
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Helper to fetch data server‑side
async function getDashboardData() {
  const repositories = await prisma.repository.findMany({
    include: { pullRequests: { include: { codeAnalyses: true } } },
  });
  return { repositories };
}

export const metadata = {
  title: 'DevPulse Dashboard',
  description: 'Live view of repositories, PR health scores, and code‑analysis cards.',
};

export default async function DashboardPage() {
  const { repositories } = await getDashboardData();

  return (
    <main className={`${inter.variable} font-sans min-h-screen bg-gray-900 p-8`}>
      <h1 className="text-4xl font-bold text-center text-white mb-8 animate-fade-in">
        DevPulse Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map(repo => (
          <section
            key={repo.id}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              <Link href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {repo.name}
              </Link>
            </h2>
            <p className="text-gray-300 mb-2">Owner: {repo.owner.email}</p>
            <p className="text-gray-300 mb-4">Created: {new Date(repo.createdAt).toLocaleDateString()}</p>
            <h3 className="text-xl font-medium text-gray-200 mb-2">Pull Requests</h3>
            <ul className="space-y-3">
              {repo.pullRequests.map(pr => {
                // Compute a simple health score from code analyses (average of scores if present)
                const scores = pr.codeAnalyses.map(a => a.score).filter(Boolean) as number[];
                const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 'N/A';
                return (
                  <li key={pr.id} className="bg-white/10 rounded-md p-3 hover:bg-white/20 transition-colors">
                    <a href={pr.title} className="text-indigo-300 hover:underline block">
                      {pr.title}
                    </a>
                    <span className="text-sm text-gray-300 block mt-1">Score: {avgScore}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

// CSS for a subtle fade‑in animation (Tailwind @layer utilities will be added in globals)

/* Add to globals.css or a dedicated CSS file */
/*
@layer utilities {
  .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
*/
