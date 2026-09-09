// seed.js
import { DataEngine } from './src/services/dataEngine.js';

const engine = new DataEngine();

const testObservations = [
  {
    text: "I am at Hospital DemoCare Pacific in Panama. They have two MR systems and one CT.",
    user: "Field_Engineer_Panama"
  },
  {
    text: "At Hospital DemoCare Horizon in Sao Paulo I saw three MR systems. Two look older (around 9 years) and one looks much newer, about 3 years.",
    user: "Sales_User_Brazil"
  },
  {
    text: "Clinica DemoCare Light in Campinas has two CT scanners from Orion Imaging, about 11 years old.",
    user: "Field_Engineer_Campinas"
  },
  {
    text: "Centro Medico DemoCare Valley has one MR system and two CTs. I do not know the brands.",
    user: "App_Specialist"
  }
];

async function seed() {
  console.log("🌱 Cargando dataset de prueba en la base de datos local...");
  for (const obs of testObservations) {
    await engine.processIncomingObservation(obs.text, obs.user);
  }
  console.log("✅ Dataset cargado con éxito.");
  
  const data = engine.getDashboardData();
  console.log(`\nClientes registrados: ${data.clientes.length}`);
  console.log(`Equipos registrados: ${data.equipos.length}`);
  console.log(`Oportunidades de renovación identificadas: ${data.oportunidades.length}\n`);
}

seed();