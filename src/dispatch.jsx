import React, { useId, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { shell } from './ui.js';
import { verifyDispatch } from './dispatch-core.js';
import data from '../connector/fixtures.json';

const live = import.meta.env.VITE_CONNECTOR === 'live';
const reasons = {
  missing: 'Vybraný doklad ve skladu neexistuje.',
  unrelated: 'Doklad patří jiné zásilce.',
  insufficient: 'Tento typ záznamu nepotvrzuje stav expedice.',
};

async function verify(shipment, document) {
  if (!live) return verifyDispatch(data, shipment, document);
  const query = new URLSearchParams({ shipment, document });
  const response = await fetch('/api/verify?' + query, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Skladový konektor se nepodařilo načíst.');
  return response.json();
}

function Dispatch() {
  const [shipment, setShipment] = useState(data.shipments[0].id);
  const [document, setDocument] = useState(data.documents[0].id);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shipmentId = useId();
  const documentId = useId();

  function change(save, value) {
    save(value);
    setResult(null);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await verify(shipment, document));
    } catch {
      setError('Skladový konektor není dostupný. Zkuste ověření znovu.');
    } finally {
      setBusy(false);
    }
  }

  return <><div className="page-title">
    <h1>Ověření expedice</h1><p className="lede">Prověřte, jestli vybraný skladový doklad opravdu potvrzuje stav zásilky.</p>
  </div><div className="columns">
    <form className="surface stack" onSubmit={submit}>
      <h2>Skladový záznam</h2>
      <label htmlFor={shipmentId}>Zásilka</label>
      <select id={shipmentId} value={shipment} disabled={busy} onChange={event => change(setShipment, event.target.value)}>
        {data.shipments.map(row => <option key={row.id} value={row.id}>{row.id} · {row.name}</option>)}
      </select>
      <label htmlFor={documentId}>Podklad</label>
      <select id={documentId} value={document} disabled={busy} onChange={event => change(setDocument, event.target.value)}>
        {data.documents.map(row => <option key={row.id} value={row.id}>{row.id} · {row.title}</option>)}
        <option value="MISSING">Chybějící doklad</option>
      </select>
      <div><button className="primary" disabled={busy}>{busy ? 'Ověřuji…' : 'Ověřit zásilku'}</button></div>
    </form>
    <section className="surface stack" aria-label="Výsledek" aria-live="polite">
      <div className="row"><h2>Výsledek</h2>{result && <span className={'pill ' + (result.status ? 'ok' : 'warn')}>
        {result.status ? 'Ověřeno' : 'Neověřeno'}</span>}</div>
      {error && <p className="error" role="alert">{error}</p>}
      {!result && !error && <p className="muted">Vyberte zásilku a podklad a spusťte ověření.</p>}
      {result && <><strong>{result.status ?? reasons[result.code]}</strong>
        {result.evidence && <div className="evidence"><h3>{result.evidence.title} · {result.evidence.id}</h3>
          <p className="muted">{result.evidence.note}</p></div>}
        <p className="small">{result.shipmentId} · {live ? 'Místní skladové API' : 'Připravené skladové záznamy'}</p>
      </>}
    </section>
  </div></>;
}

shell('Workflow Lab', 'Expedice');
createRoot(document.querySelector('#dispatch')).render(<Dispatch />);
