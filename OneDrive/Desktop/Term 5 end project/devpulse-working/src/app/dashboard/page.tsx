// src/app/dashboard/page.tsx
import { Inter } from 'next/font/google';
import Link from 'next/link';
import connectToDatabase from '../../lib/mongodb';
import Repository, { IRepository } from '../../models/Repository';
import PullRequest from '../../models/PullRequest';
import CodeAnalysis from '../../models/CodeAnalysis';
import { Types } from 'mongoose';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'DevPulse Dashboard',
  description: 'Live view of repositories, PR health scores, and code‑analysis cards.',
};

interface PRWithScore {
  _id: Types.ObjectId;
  title: string;
  state: string;
  avgScore: string;
}

interface RepoWithPRs {
  _id: Types.ObjectId;
  name: string;
  url: string;
  createdAt: Date;
  owner: { name: string; email: string } | null;
  pullRequests: PRWithScore[];
}

async function getDashboardData(): Promise<RepoWithPRs[]> {
  await connectToDatabase();

  const repositories = await Repository.find()
    .populate('owner', 'name email')
    .lean();

  const result: RepoWithPRs[] = await Promise.all(
    repositories.map(async (repo) => {
      const prs = await PullRequest.find({ repository: repo._id }).lean();

      const pullRequests: PRWithScore[] = await Promise.all(
        prs.map(async (pr) => {
          const analyses = await CodeAnalysis.find({ pullRequest: pr._id }).lean();
          const scores = analyses
            .map((a) => a.score)
            .filter((s): s is number => typeof s === 'number');
          const avgScore =
            scores.length > 0
              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
              : 'N/A';
          return {
            _id: pr._id as Types.ObjectId,
            title: pr.title,
            state: pr.state,
            avgScore,
          };
        })
      );

      const ownerRaw = repo.owner as unknown as { name: string; email: string } | null;

      return {
        _id: repo._id as Types.ObjectId,
        name: repo.name,
        url: repo.url,
        createdAt: repo.createdAt,
        owner: ownerRaw,
        pullRequests,
      };
    })
  );

  return result;
}

const stateColor: Record<string, string> = {
  open: 'text-green-400',
  closed: 'text-red-400',
  merged: 'text-purple-400',
};

export default async function DashboardPage() {
  const repositories = await getDashboardData();

  return (
    <main className={`${inter.variable} font-sans min-h-screen bg-gray-900 p-8`}>
      <h1 className="text-4xl font-bold text-center text-white mb-2 animate-fade-in">
        DevPulse Dashboard
      </h1>
      <p className="text-center text-gray-400 mb-10 text-sm">
        Powered by MongoDB Atlas · {repositories.length} repositories tracked
      </p>

      {repositories.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-gray-500">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" />
          </svg>
          <p className="text-lg">No repositories yet. Connect a GitHub repo to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <section
              key={repo._id.toString()}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 hover:border-indigo-500/40"
            >
              <h2 className="text-xl font-semibold text-white mb-1 truncate">
                <Link
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-400 transition-colors"
                >
                  {repo.name}
                </Link>
              </h2>
              {repo.owner && (
                <p className="text-gray-400 text-sm mb-1">👤 {repo.owner.name || repo.owner.email}</p>
              )}
              <p className="text-gray-500 text-xs mb-4">
                Created: {new Date(repo.createdAt).toLocaleDateString()}
              </p>

              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-2">
                Pull Requests ({repo.pullRequests.length})
              </h3>
              {repo.pullRequests.length === 0 ? (
                <p className="text-gray-600 text-sm italic">No PRs yet</p>
              ) : (
                <ul className="space-y-2">
                  {repo.pullRequests.map((pr) => (
                    <li
                      key={pr._id.toString()}
                      className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors"
                    >
                      <span className="text-indigo-300 block font-medium text-sm truncate">
                        {pr.title}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs capitalize ${stateColor[pr.state] ?? 'text-gray-400'}`}>
                          ● {pr.state}
                        </span>
                        <span className="text-xs text-gray-400">
                          Score: <strong className="text-white">{pr.avgScore}</strong>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
