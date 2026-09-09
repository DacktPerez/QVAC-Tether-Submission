// seed.js
import { DataEngine } from './src/services/dataEngine.js';

const engine = new DataEngine();

// Lista completa de las 20 observaciones del dataset oficial de Philips
const officialObservations = [
  { text: "I am at Hospital DemoCare Pacific in Panama. They have two MR systems and one CT.", user: "Field User 01" },
  { text: "Hospital DemoCare Horizon has three MR systems. Two look older and one seems newer.", user: "Sales User 02" },
  { text: "At Clinica DemoCare Light I saw two CT scanners.", user: "Field User 03" },
  { text: "They also have about five ultrasound systems.", user: "Field User 03" },
  { text: "Centro Medico DemoCare Valley has one MR, two CTs and several ultrasound systems.", user: "App Specialist 04" },
  { text: "Hospital DemoCare North in Monterrey has six ultrasound units, mostly new.", user: "Sales User 05" },
  { text: "At Clinica DemoCare Andes in Santiago there is one older CT system.", user: "Field User 06" },
  { text: "They also have two MR systems from the same manufacturer.", user: "Field User 06" },
  { text: "Hospital DemoCare Park in Buenos Aires has one MR that looks around ten years old.", user: "Field User 07" },
  { text: "I also counted three CT scanners.", user: "Field User 07" },
  { text: "Clinica DemoCare Central in Bogota has many ultrasound systems, maybe eight.", user: "Sales User 08" },
  { text: "Hospital DemoCare Pines in Medellin has two MR systems.", user: "Field User 09" },
  { text: "Instituto DemoCare Lima has two CT systems, both quite old.", user: "Field User 10" },
  { text: "They recently added one MR.", user: "Field User 10" },
  { text: "Hospital DemoCare Green in San Jose has four ultrasound systems, all the same family.", user: "App Specialist 11" },
  { text: "Centro Diagnostico DemoCare Caribbean in Santo Domingo has one CT, relatively new.", user: "Sales User 12" },
  { text: "Hospital DemoCare Metro North in Quito has two MR systems. I could not see the model.", user: "Field User 13" }
];

async function runSeed() {
  console.log("🌱 Poblando la base de datos con las 20 observaciones oficiales del Hackathon...");
  for (const obs of officialObservations) {
    await engine.processIncomingObservation(obs.text, obs.user);
  }
  
  const data = engine.getDashboardData();
  console.log("✅ Carga oficial completada con éxito.");
  console.log(`- Clientes totales: ${data.clientes.length}`);
  console.log(`- Equipos registrados: ${data.equipos.length}`);
  console.log(`- Oportunidades de renovación (>= 7 años): ${data.oportunidades.length}`);
}

runSeed();