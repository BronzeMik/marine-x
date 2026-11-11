import PageShell from '../../../components/PageShell';

export default function Loading() {
  return (
    <PageShell>
      <div className="shell gear-intro"><span className="mini">BY DESIGN. NOT DEFAULT.</span><h1>FIND YOUR <em>EDGE.</em></h1></div>
      <section className="affiliate-section" style={{ paddingTop: 40 }} aria-busy="true" aria-label="Loading gear">
        <div className="shell">
          <div className="affiliate-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="affiliate-card skeleton-card" key={i}><div className="skeleton" style={{ height: 230 }} /><div style={{ padding: 24 }}><div className="skeleton" style={{ height: 12, width: '40%' }} /><div className="skeleton" style={{ height: 24, width: '75%', marginTop: 16 }} /><div className="skeleton" style={{ height: 60, marginTop: 16 }} /></div></div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
