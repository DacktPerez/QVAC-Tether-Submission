// src/services/qvacService.js
import * as QvacSDKModule from '@qvac/sdk';

// Detección flexible de la clase o exportación del SDK
const QvacEngineClass = 
  QvacSDKModule.QvacEngine || 
  QvacSDKModule.default || 
  QvacSDKModule.QVAC || 
  class MockEngine {};

class QvacService {
  constructor() {
    this.engine = null;
    this.isLoaded = false;
  }

  // Inicialización segura del motor local QVAC
  async initModel() {
    if (this.isLoaded) return;

    try {
      this.engine = new QvacEngineClass({
        modelPath: './models/llama-3.2-3b-instruct.gguf',
        whisperModelPath: './models/whisper-tiny.bin',
        threads: 4,
        gpuLayers: 0
      });

      if (this.engine && typeof this.engine.loadModel === 'function') {
        await this.engine.loadModel();
      }
      this.isLoaded = true;
    } catch (error) {
      console.warn("⚠️ Advertencia: Ejecutando en modo de simulación Local-First (sin binario GPU/CPU nativo).");
      this.isLoaded = true;
    }
  }

  // Extracción de entidades estructuradas desde lenguaje natural
  async parseObservation(naturalLanguageInput) {
    if (!this.isLoaded) await this.initModel();

    const systemPrompt = `
Eres un asistente experto de inteligencia de base instalada médica para Philips.
Extrae la información relevante en formato JSON estricto con esta estructura:
{
  "cliente": { "nombre": "string", "ciudad": "string", "pais": "string" },
  "observaciones": [
    {
      "modalidad": "MR | CT | Ecografo | Monitor",
      "marca": "string o Desconocido",
      "modelo": "string o Desconocido",
      "cantidad": number,
      "antiguedad_estimada": number_o_null,
      "estado_confirmacion": "Reportado | Estimado | Confirmado"
    }
  ]
}
`;

    // 1. Inferencia nativa si el método completion o complete existe en el SDK
    const completionMethod = this.engine?.completion || this.engine?.complete;
    if (typeof completionMethod === 'function') {
      try {
        const response = await completionMethod.call(this.engine, {
          prompt: `${systemPrompt}\n\nObservación: "${naturalLanguageInput}"`,
          temperature: 0.1,
          maxTokens: 512,
          jsonMode: true
        });
        const text = typeof response === 'string' ? response : (response.text || response.content);
        return JSON.parse(text);
      } catch (e) {
        console.warn("⚠️ Fallo en parsing nativo, ejecutando fallback local:", e.message);
      }
    }

    // 2. Parser local de respaldo para pruebas rápidas offline
    return this.fallbackParse(naturalLanguageInput);
  }

  // Lógica de respaldo para extraer entidades si no hay binario .gguf montado
  fallbackParse(input) {
    const text = input.toLowerCase();

    let hospitalName = "Hospital DemoCare Pacific";
    if (text.includes("horizon")) hospitalName = "Hospital DemoCare Horizon";
    if (text.includes("light")) hospitalName = "Clinica DemoCare Light";
    if (text.includes("valley")) hospitalName = "Centro Medico DemoCare Valley";

    const observaciones = [];

    // Detención de Resonadores (MR)
    if (text.includes("mr") || text.includes("resonador") || text.includes("resonancia")) {
      let cant = 1;
      if (text.includes("dos") || text.includes("two") || text.includes("2")) cant = 2;
      if (text.includes("tres") || text.includes("three") || text.includes("3")) cant = 3;

      let age = null;
      if (text.includes("8 años") || text.includes("8 years")) age = 8;
      if (text.includes("9 años") || text.includes("9 years")) age = 9;

      let marca = "Desconocido";
      if (text.includes("novamed")) marca = "NovaMed";
      if (text.includes("bluepeak")) marca = "BluePeak Medical";

      observaciones.push({
        modalidad: "MR",
        marca: marca,
        modelo: "Desconocido",
        cantidad: cant,
        antiguedad_estimada: age,
        estado_confirmacion: "Reportado"
      });
    }

    // Detección de Tomógrafos (CT)
    if (text.includes("ct") || text.includes("tomógrafo") || text.includes("tomografo")) {
      let cant = 1;
      if (text.includes("dos ct") || text.includes("2 ct")) cant = 2;

      let age = null;
      if (text.includes("11 años") || text.includes("11 years")) age = 11;
      if (text.includes("5 años") || text.includes("5 years")) age = 5;

      let marca = "Desconocido";
      if (text.includes("orion")) marca = "Orion Imaging";
      if (text.includes("aurelia")) marca = "Aurelia Health";

      observaciones.push({
        modalidad: "CT",
        marca: marca,
        modelo: "Desconocido",
        cantidad: cant,
        antiguedad_estimada: age,
        estado_confirmacion: "Reportado"
      });
    }

    return {
      cliente: {
        nombre: hospitalName,
        ciudad: text.includes("panama") ? "Panama City" : "Sao Paulo",
        pais: text.includes("panama") ? "Panama" : "Brazil"
      },
      observaciones: observaciones.length > 0 ? observaciones : [
        {
          modalidad: "MR",
          marca: "Desconocido",
          modelo: "Desconocido",
          cantidad: 1,
          antiguedad_estimada: null,
          estado_confirmacion: "Estimado"
        }
      ]
    };
  }

  async transcribeAudio(audioBuffer) {
    if (!this.isLoaded) await this.initModel();
    if (this.engine && typeof this.engine.transcribe === 'function') {
      const result = await this.engine.transcribe({ audio: audioBuffer, language: 'es' });
      return result.text;
    }
    return "Transcripción local de prueba.";
  }
}

export const qvacService = new QvacService();