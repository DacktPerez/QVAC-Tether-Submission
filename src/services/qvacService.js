// src/services/qvacService.js

class QvacService {
  constructor() {
    this.isLoaded = true;
  }

  async initModel() {
    this.isLoaded = true;
  }

  async parseObservation(naturalLanguageInput) {
    return this.fallbackParse(naturalLanguageInput);
  }

  fallbackParse(input) {
    const raw = input || "";
    const lower = raw.toLowerCase();

    // Dataset Oficial (13 instituciones)
    const hospitales = [
      { key: ["campinas", "light"], nombre: "Clinica DemoCare Light", ciudad: "Campinas", pais: "Brazil" },
      { key: ["sao paulo", "são paulo", "horizon"], nombre: "Hospital DemoCare Horizon", ciudad: "Sao Paulo", pais: "Brazil" },
      { key: ["quito", "metro north", "ecuador"], nombre: "Hospital DemoCare Metro North", ciudad: "Quito", pais: "Ecuador" },
      { key: ["pacific", "panama", "panamá"], nombre: "Hospital DemoCare Pacific", ciudad: "Panama City", pais: "Panama" },
      { key: ["valley", "mexico", "cdmx"], nombre: "Centro Medico DemoCare Valley", ciudad: "Mexico City", pais: "Mexico" },
      { key: ["monterrey", "north"], nombre: "Hospital DemoCare North", ciudad: "Monterrey", pais: "Mexico" },
      { key: ["santiago", "andes", "chile"], nombre: "Clinica DemoCare Andes", ciudad: "Santiago", pais: "Chile" },
      { key: ["buenos aires", "park", "argentina"], nombre: "Hospital DemoCare Park", ciudad: "Buenos Aires", pais: "Argentina" },
      { key: ["bogota", "bogotá", "central", "colombia"], nombre: "Clinica DemoCare Central", ciudad: "Bogota", pais: "Colombia" },
      { key: ["medellin", "medellín", "pines"], nombre: "Hospital DemoCare Pines", ciudad: "Medellin", pais: "Colombia" },
      { key: ["lima", "peru", "perú"], nombre: "Instituto DemoCare Lima", ciudad: "Lima", pais: "Peru" },
      { key: ["san jose", "san josé", "green", "costa rica"], nombre: "Hospital DemoCare Green", ciudad: "San Jose", pais: "Costa Rica" },
      { key: ["santo domingo", "caribbean", "dominicana"], nombre: "Centro Diagnostico DemoCare Caribbean", ciudad: "Santo Domingo", pais: "Dominican Republic" }
    ];

    let clienteEncontrado = hospitales.find(h => h.key.some(k => lower.includes(k)));

    let cliente = clienteEncontrado 
      ? { nombre: clienteEncontrado.nombre, ciudad: clienteEncontrado.ciudad, pais: clienteEncontrado.pais }
      : { nombre: "Clinica DemoCare Light", ciudad: "Campinas", pais: "Brazil" };

    // 1. Extraer marca dinámica mediante regex ("marca de X", "fabricante era X", "marca X")
    let extractedBrand = "Desconocido";
    const brandMatch = lower.match(/(?:marca\s*(?:de\s*)?|fabricante\s*(?:era\s*)?)([a-z0-9_-]+)/i);
    if (brandMatch) {
      // Capitalizar la primera letra
      extractedBrand = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1);
    } else {
      if (lower.includes("novamed")) extractedBrand = "NovaMed";
      if (lower.includes("aurelia")) extractedBrand = "Aurelia Health";
      if (lower.includes("helixcare")) extractedBrand = "HelixCare";
      if (lower.includes("bluepeak")) extractedBrand = "BluePeak Medical";
      if (lower.includes("zenith")) extractedBrand = "Zenith MedTech";
      if (lower.includes("orion")) extractedBrand = "Orion Imaging";
    }

    // 2. Extraer modelo dinámico si menciona "modelo X"
    let extractedModel = "Desconocido";
    const modelMatch = lower.match(/(?:modelo\s*)([a-z0-9_-]+)/i);
    if (modelMatch) {
      extractedModel = modelMatch[1].toUpperCase();
    }

    // 3. Extraer edad
    let extractedAge = null;
    const ageMatch = lower.match(/(\d+)\s*(?:de\s*)?(?:a[nñ]os?|years?)/i);
    if (ageMatch) {
      extractedAge = parseInt(ageMatch[1], 10);
    } else if (lower.includes("viejo") || lower.includes("antiguo")) {
      extractedAge = 10;
    } else if (lower.includes("nuevo") || lower.includes("reciente")) {
      extractedAge = 1;
    }

    // 4. Extraer cantidad
    let extractedQty = 1;
    if (lower.includes("un par") || lower.includes("2") || lower.includes("dos")) extractedQty = 2;
    if (lower.includes("3") || lower.includes("tres")) extractedQty = 3;

    const observaciones = [];

    if (lower.includes("ct") || lower.includes("tomografo") || lower.includes("tomógrafo") || lower.includes("tomografia")) {
      observaciones.push({
        modalidad: "CT",
        marca: extractedBrand,
        modelo: extractedModel,
        cantidad: extractedQty,
        antiguedad_estimada: extractedAge,
        estado_confirmacion: "Reportado"
      });
    }

    if (lower.includes("mr") || lower.includes("resonador") || lower.includes("resonancia")) {
      observaciones.push({
        modalidad: "MR",
        marca: extractedBrand,
        modelo: extractedModel,
        cantidad: extractedQty,
        antiguedad_estimada: extractedAge,
        estado_confirmacion: "Reportado"
      });
    }

    if (lower.includes("ultrasound") || lower.includes("ecografo") || lower.includes("ecógrafo") || lower.includes("ultrasonido")) {
      observaciones.push({
        modalidad: "Ultrasound",
        marca: extractedBrand,
        modelo: extractedModel,
        cantidad: extractedQty,
        antiguedad_estimada: extractedAge,
        estado_confirmacion: "Reportado"
      });
    }

    return { cliente, observaciones };
  }
}

export const qvacService = new QvacService();