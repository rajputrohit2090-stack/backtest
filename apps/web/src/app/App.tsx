import { Card } from '@backtest-ai/ui';
import { productName } from '@backtest-ai/shared';

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">SaaS Foundation</p>
        <h1 className="mt-6 text-5xl font-bold tracking-tight">{productName}</h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          A production-ready monorepo foundation with React, Fastify, FastAPI, PostgreSQL, Redis, Prisma,
          Docker, CI, health checks, and quality tooling.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {['Web app', 'Node API', 'Python engine'].map((item) => (
            <Card key={item}>
              <h2 className="text-lg font-semibold text-slate-950">{item}</h2>
              <p className="mt-2 text-sm text-slate-600">Configured and ready for product development.</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
