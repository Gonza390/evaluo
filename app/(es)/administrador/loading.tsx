import './admin-home.css';

export default function AdministradorLoading() {
  return (
    <main className="ehome" aria-busy="true" aria-label="Cargando administrador">
      <header className="eh-header">
        <div className="eh-top"><span className="eh-logo">evaluo<span>.</span></span></div>
        <div className="eh-tabs" aria-hidden="true" />
      </header>
      <section className="eh-heading" role="status">
        <div>
          <div className="eh-eyebrow">Evaluo / Administrador</div>
          <h1>Cargando...</h1>
        </div>
      </section>
      <div className="eh-grid" aria-hidden="true">
        <div className="eh-grid-row">
          <section className="eh-panel eh-half" style={{minHeight:240}} />
          <section className="eh-panel eh-half" style={{minHeight:240}} />
        </div>
        <div className="eh-grid-row"><section className="eh-panel eh-wide" style={{minHeight:300}} /></div>
      </div>
    </main>
  );
}
