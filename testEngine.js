import { DataEngine } from './src/services/dataEngine.js';

async function test() {
  const engine = new DataEngine(':memory:');
  console.log("Procesando observación de prueba...");

  await engine.processIncomingObservation(
    "Estoy en Hospital DemoCare Pacific en Panamá. Tienen dos resonadores MR de 8 años marca NovaMed y un tomógrafo CT.",
    "Ingeniero_Prueba"
  );

  const data = engine.getDashboardData();
  if (data.clientes.length !== 1 || data.equipos.length !== 2) throw new Error('La extraccion o deduplicacion no produjo el inventario esperado.');
  if (data.oportunidades.length !== 1) throw new Error('No se detecto la oportunidad de renovacion esperada.');
  await engine.processIncomingObservation(
    'fui al hospital de campinas y habia un tomografo healthlife bien viejo, parecia de unos 9 años',
    'Ingeniero_Prueba'
  );
  const dataWithCampinas = engine.getDashboardData();
  const campinasCt = dataWithCampinas.equipos.find(item => item.ciudad === 'Campinas' && item.modalidad === 'CT');
  if (dataWithCampinas.clientes.length !== 2 || !campinasCt || campinasCt.marca !== 'HealthLife' || campinasCt.antiguedad_estimada !== 9) {
    throw new Error('Una observacion de Campinas se mezclo con otro hospital o perdio sus atributos.');
  }
  console.log("--- CLIENTES REGISTRADOS ---");
  console.table(data.clientes);
  console.log("--- EQUIPOS REGISTRADOS ---");
  console.table(data.equipos);
  console.log("--- OPORTUNIDADES DE RENOVACIÓN (>= 7 AÑOS) ---");
  console.table(data.oportunidades);
}

test();
