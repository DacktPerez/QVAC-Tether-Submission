import { completion, loadModel, transcribe, unloadModel } from '@qvac/sdk';

const UNKNOWN = 'Desconocido';
const SYSTEM_PROMPT = 'Extrae inventario hospitalario. Responde solo JSON: {"cliente":{"nombre":string|null,"ciudad":string|null,"pais":string|null},"observaciones":[{"modalidad":"MR"|"CT"|"Ultrasound"|"Monitor"|"Otro","marca":string|null,"modelo":string|null,"cantidad":number,"antiguedad_estimada":number|null,"estado_confirmacion":"Confirmado"|"Reportado"|"Estimado"|"Desconocido"}]}. No inventes datos.';

class QvacService {
  constructor() { this.modelId = null; this.initialized = false; }

  async initModel() {
    if (this.initialized) return this.modelId;
    if (!process.env.QVAC_LLM_MODEL) return null;
    this.modelId = await loadModel({ modelSrc: process.env.QVAC_LLM_MODEL, modelType: 'llamacpp-completion', modelConfig: { ctx_size: 2048 } });
    this.initialized = true;
    return this.modelId;
  }

  async parseObservation(text) {
    const input = String(text || '').trim();
    if (!input) return { cliente: null, observaciones: [], source: 'empty' };
    try {
      const modelId = await this.initModel();
      if (modelId) {
        const run = completion({ modelId, stream: false, responseFormat: { type: 'json_object' }, history: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }] });
        const result = await run.final;
        return { ...this.normalize(JSON.parse(String(result.content).trim().replace(/^```json\s*|\s*```$/g, ''))), source: 'qvac' };
      }
    } catch (error) { console.warn(`QVAC unavailable; local parser used: ${error.message}`); }
    return { ...this.fallbackParse(input), source: 'heuristic' };
  }

  async transcribeAudio(audioPath) {
    if (!process.env.QVAC_WHISPER_MODEL) throw new Error('Configure QVAC_WHISPER_MODEL with a local Whisper model path.');
    const modelId = await loadModel({ modelSrc: process.env.QVAC_WHISPER_MODEL, modelType: 'whispercpp-transcription' });
    try { return await transcribe({ modelId, audioChunk: audioPath, prompt: 'Inventario hospitalario en español.' }); }
    finally { await unloadModel({ modelId }); }
  }

  normalize(data) {
    return {
      cliente: data?.cliente?.nombre ? { nombre: String(data.cliente.nombre).trim(), ciudad: data.cliente.ciudad || null, pais: data.cliente.pais || null } : null,
      observaciones: Array.isArray(data?.observaciones) ? data.observaciones.filter(item => item?.modalidad).map(item => ({
        modalidad: String(item.modalidad), marca: item.marca || UNKNOWN, modelo: item.modelo || UNKNOWN, cantidad: Math.max(1, Number.parseInt(item.cantidad, 10) || 1),
        antiguedad_estimada: Number.isFinite(Number(item.antiguedad_estimada)) ? Number(item.antiguedad_estimada) : null,
        estado_confirmacion: ['Confirmado', 'Reportado', 'Estimado', 'Desconocido'].includes(item.estado_confirmacion) ? item.estado_confirmacion : 'Reportado'
      })) : []
    };
  }

  fallbackParse(input) {
    const lower = input.toLowerCase();
    const hospitals = [
      ['pacific', 'Hospital DemoCare Pacific', 'Panama City', 'Panama'], ['horizon', 'Hospital DemoCare Horizon', 'Sao Paulo', 'Brazil'], ['light', 'Clinica DemoCare Light', 'Campinas', 'Brazil'], ['campinas', 'Clinica DemoCare Light', 'Campinas', 'Brazil'], ['metro north', 'Hospital DemoCare Metro North', 'Quito', 'Ecuador'], ['valley', 'Centro Medico DemoCare Valley', 'Mexico City', 'Mexico'], ['north', 'Hospital DemoCare North', 'Monterrey', 'Mexico'], ['andes', 'Clinica DemoCare Andes', 'Santiago', 'Chile'], ['park', 'Hospital DemoCare Park', 'Buenos Aires', 'Argentina'], ['central', 'Clinica DemoCare Central', 'Bogota', 'Colombia'], ['pines', 'Hospital DemoCare Pines', 'Medellin', 'Colombia'], ['lima', 'Instituto DemoCare Lima', 'Lima', 'Peru'], ['green', 'Hospital DemoCare Green', 'San Jose', 'Costa Rica'], ['caribbean', 'Centro Diagnostico DemoCare Caribbean', 'Santo Domingo', 'Dominican Republic']
    ];
    const found = hospitals.find(([key]) => lower.includes(key));
    const cliente = found ? { nombre: found[1], ciudad: found[2], pais: found[3] } : null;
    const age = Number.parseInt(lower.match(/(\d+)\s*(?:de\s*)?(?:a[nñ]os?|years?)/)?.[1], 10);
    const explicitBrand = lower.match(/(?:marca|fabricante)\s*(?:de\s*)?([\w-]+)/i);
    const knownBrands = [['healthlife', 'HealthLife'], ['novamed', 'NovaMed'], ['aurelia', 'Aurelia Health'], ['helixcare', 'HelixCare'], ['bluepeak', 'BluePeak Medical'], ['zenith', 'Zenith MedTech'], ['orion', 'Orion Imaging']];
    const knownBrand = knownBrands.find(([key]) => lower.includes(key));
    const brand = explicitBrand?.[1] || knownBrand?.[1] || UNKNOWN;
    const model = lower.match(/modelo\s*([\w-]+)/i)?.[1] || UNKNOWN;
    const wordNumbers = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8 };
    const getQuantity = position => {
      const near = lower.slice(Math.max(0, position - 35), position + 15);
      const matches = [...near.matchAll(/\b(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho)\b/gi)];
      const value = matches.at(-1)?.[1]?.toLowerCase();
      return Number.parseInt(value, 10) || wordNumbers[value] || 1;
    };
    const modalities = [['MR', /\bmr\b|resonador(?:es)?|resonancia/], ['CT', /\bct\b|tom[oó]grafo(?:s)?|tomograf[ií]a/], ['Ultrasound', /ultrasound|ec[oó]grafo(?:s)?|ultrasonido/], ['Monitor', /monitores?|monitoring/]];
    const detected = modalities.filter(([, re]) => re.test(lower)).map(([modalidad, re]) => ({ modalidad, position: lower.search(re) }));
    const agePosition = lower.search(/\d+\s*(?:de\s*)?(?:a[nñ]os?|years?)/);
    const closestToAge = agePosition >= 0 ? detected.reduce((closest, item) => Math.abs(item.position - agePosition) < Math.abs(closest.position - agePosition) ? item : closest) : null;
    const brandPosition = explicitBrand ? lower.indexOf(explicitBrand[0]) : knownBrand ? lower.indexOf(knownBrand[0]) : -1;
    const modalitiesBeforeBrand = detected.filter(item => item.position <= brandPosition);
    const closestToBrand = modalitiesBeforeBrand.length ? modalitiesBeforeBrand.at(-1) : null;
    const observaciones = detected.map(({ modalidad, position }) => ({
      modalidad, marca: closestToBrand?.modalidad === modalidad && brand !== UNKNOWN ? brand[0].toUpperCase() + brand.slice(1) : UNKNOWN, modelo: model === UNKNOWN ? UNKNOWN : model.toUpperCase(), cantidad: getQuantity(position),
      antiguedad_estimada: closestToAge?.modalidad === modalidad && Number.isFinite(age) ? age : null, estado_confirmacion: 'Reportado'
    }));
    return { cliente, observaciones };
  }
}

export const qvacService = new QvacService();
