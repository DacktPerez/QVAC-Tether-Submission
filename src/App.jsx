// src/App.jsx
import React, { useState, useEffect } from 'react';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({ clientes: [], equipos: [], oportunidades: [], preguntas: [] });
  const [selectedClient, setSelectedClient] = useState(null);

  const loadData = async (targetClientId = null) => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard');
      if (!response.ok) throw new Error("Error al cargar datos");
      const result = await response.json();

      setData({
        clientes: [...result.clientes],
        equipos: [...result.equipos],
        oportunidades: [...result.oportunidades],
        preguntas: [...(result.preguntas || [])]
      });

      if (result.clientes && result.clientes.length > 0) {
        if (targetClientId) {
          const match = result.clientes.find(c => c.id === targetClientId);
          if (match) setSelectedClient(match);
        } else if (!selectedClient) {
          setSelectedClient(result.clientes[0]);
        } else {
          const current = result.clientes.find(c => c.id === selectedClient.id);
          if (current) setSelectedClient(current);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessObservation = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:3001/api/observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, user: 'Ingeniero_Campo_UI' })
      });

      if (res.ok) {
        const result = await res.json();
        setInputText('');
        // Cambiar la vista automáticamente al cliente retornado por el backend
        await loadData(result.clienteId);
      } else {
        alert("Error al procesar la observación.");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredEquipments = (data.equipos || []).filter(eq => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (q.includes('7 años') || q.includes('> 7') || q.includes('renovación') || q.includes('renovacion')) {
      return eq.antiguedad_estimada >= 7;
    }
    return (
      (eq.modalidad && eq.modalidad.toLowerCase().includes(q)) ||
      (eq.cliente_nombre && eq.cliente_nombre.toLowerCase().includes(q)) ||
      (eq.ciudad && eq.ciudad.toLowerCase().includes(q)) ||
      (eq.marca && eq.marca.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Philips Customer Installed Base Intelligence</h1>
          <p className="text-sm text-slate-500">Procesamiento Edge AI & Local-First (@qvac/sdk + SQLite)</p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Modo Local-First Activo
        </span>
      </header>

      <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-2">Capturar Observación de Campo</h2>
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            rows="2"
            placeholder="Ejemplo: 'En el Hospital de Quito vimos un tomógrafo CT viejo de 12 años sin marca'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleProcessObservation}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
          >
            {isProcessing ? 'Procesando...' : 'Procesar Localmente'}
          </button>
        </div>
      </section>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <input
          type="text"
          className="w-full p-2.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="🔍 Consultar base instalada (ej: 'Panama', 'MR', 'equipos de más de 7 años')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold">Vista 360° del Cliente</h2>
          
          <div className="flex gap-2 border-b pb-3 overflow-x-auto">
            {(data.clientes || []).map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap ${
                  selectedClient?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.nombre} ({c.ciudad})
              </button>
            ))}
          </div>

          {selectedClient && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700">{selectedClient.nombre} - {selectedClient.ciudad}, {selectedClient.pais}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredEquipments
                  .filter(e => e.cliente_id === selectedClient.id)
                  .map(eq => (
                    <div key={eq.id} className="p-4 border rounded-xl bg-slate-50 space-y-1.5 relative">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{eq.modalidad}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          Confianza: {eq.nivel_confianza}%
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-base">{eq.cantidad}x {eq.marca} ({eq.modelo})</p>
                      <p className="text-xs text-slate-500">
                        Antigüedad: {eq.antiguedad_estimada ? `${eq.antiguedad_estimada} años` : 'Desconocida'}
                      </p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        eq.estado_confirmacion === 'Reportado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Estado: {eq.estado_confirmacion}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">❓ Preguntas de Seguimiento Sugeridas</h4>
                <div className="space-y-2">
                  {(data.preguntas || [])
                    .filter(p => p.cliente_id === selectedClient.id)
                    .map(p => (
                      <div key={p.id} className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex justify-between items-center">
                        <span><strong>[{p.modalidad}]</strong> {p.pregunta_generada}</span>
                      </div>
                    ))}
                  {(data.preguntas || []).filter(p => p.cliente_id === selectedClient.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No hay preguntas pendientes para este cliente.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
            <span>🚨</span> Oportunidades de Renovación
          </h2>
          <p className="text-xs text-slate-500">Equipos detectados con antigüedad ≥ 7 años</p>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(data.oportunidades || []).length === 0 ? (
              <p className="text-xs text-slate-400">Sin equipos antiguos detectados.</p>
            ) : (
              data.oportunidades.map(op => (
                <div key={op.id} className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg space-y-1">
                  <p className="font-bold text-xs text-slate-800">{op.cliente_nombre} ({op.ciudad})</p>
                  <p className="text-xs text-slate-600">{op.cantidad}x {op.modalidad} - {op.marca} ({op.antiguedad_estimada} años)</p>
                  <p className="text-[10px] text-amber-700 font-semibold uppercase">Recomendación: Ofrecer Upgrade/Renovación</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}