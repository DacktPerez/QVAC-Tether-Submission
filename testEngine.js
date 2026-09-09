import { DataEngine } from './src/services/dataEngine.js';

async function test() {
  const engine = new DataEngine();
  console.log("Procesando observación de prueba...");

  await engine.processIncomingObservation(
    "Estoy en Hospital DemoCare Pacific en Panamá. Tienen dos resonadores MR de 8 años marca NovaMed y un tomógrafo CT.",
    "Ingeniero_Prueba"
  );

  const data = engine.getDashboardData();
  console.log("--- CLIENTES REGISTRADOS ---");
  console.table(data.clientes);
  console.log("--- EQUIPOS REGISTRADOS ---");
  console.table(data.equipos);
  console.log("--- OPORTUNIDADES DE RENOVACIÓN (>= 7 AÑOS) ---");
  console.table(data.oportunidades);
}

test();