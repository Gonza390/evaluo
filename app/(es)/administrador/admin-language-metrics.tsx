import type { LanguageMetrics, LanguageMetric } from './admin-language-actions';
import './admin-language-metrics.css';

const labels: Record<LanguageMetric['language'], string> = {
  es: 'Español', en: 'Inglés', unknown: 'Sin identificar',
};
const fmt = (n: number) => Number(n || 0).toLocaleString('es-AR');
const percent = (n: number, d: number) => d > 0 ? (100 * n / d).toFixed(1).replace('.', ',') + '%' : '—';

export function AdminLanguageMetrics({ data }: { data: LanguageMetrics }) {
  const total = data.categories.reduce((n, item) => n + Number(item.registered || 0), 0);
  return <section className="eh-panel eh-language-section" aria-label="Usuarios por idioma">
    <div className="eh-section-head eh-language-heading">
      <div className="eh-head-content"><h2>Usuarios por idioma</h2>
        <small>Idioma de interfaz de la cuenta · {data.from} a {data.to}</small>
      </div>
    </div>
    <div className="eh-language-cards">
      {data.categories.map((item) => <div className="eh-language-card" key={item.language}>
        <div className="eh-language-kicker">{labels[item.language]}</div>
        <div className="eh-language-total"><strong>{fmt(item.registered)}</strong>
          <span>{percent(item.registered, total)} del total</span></div>
        <div className="eh-language-mini">
          <div><span>Nuevos</span><strong>{fmt(item.new_users)}</strong></div>
          <div><span>Activos</span><strong>{fmt(item.active_users)}</strong></div>
          <div><span>Estudiaron</span><strong>{fmt(item.studied_users)}</strong></div>
        </div>
      </div>)}
    </div>
    <p className="eh-language-footnote">La clasificación refleja la preferencia de interfaz actualmente guardada, no el país ni el idioma del documento. Las cuentas sin preferencia registrada no se presumen españolas. La actividad y el estudio corresponden al período seleccionado; no se conserva el historial de cambios de idioma.</p>
  </section>;
}
