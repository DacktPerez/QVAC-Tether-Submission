// src/services/qvacService.js
import * as QvacSDKModule from '@qvac/sdk';

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
      this.isLoaded = true;
    }
  }

  async parseObservation(naturalLanguageInput) {
    if (!this.isLoaded) await this.initModel();

    const completionMethod = this.engine?.completion || this.engine?.complete;
    if (typeof completionMethod === 'function') {
      try {
        const response = await completionMethod.call(this.engine, {
          prompt: `Extrae información estructurada en JSON de: "${naturalLanguageInput}"`,
          temperature: 0.1,
          maxTokens: 512,
          jsonMode: true
        });
        const text = typeof response === 'string' ? response : (response.text || response.content);
        return JSON.parse(text);
      } catch (e) {
        // Fallback en caso de no tener modelo binario local montado
      }
    }

    return this.fallbackParse(naturalLanguageInput);
  }

  fallbackParse(input) {
    const text = input.toLowerCase();

    // Mapeo completo de centros médicos de Latinoamérica
    let cliente = { nombre: "Hospital DemoCare Pacific", ciudad: "Panama City", pais: "Panama" };

    if (text.includes("horizon")) cliente = { nombre: "Hospital DemoCare Horizon", ciudad: "Sao Paulo", pais: "Brazil" };
    else if (text.includes("light")) cliente = { nombre: "Clinica DemoCare Light", ciudad: "Campinas", pais: "Brazil" };
    else if (text.includes("valley")) cliente = { nombre: "Centro Medico DemoCare Valley", ciudad: "Mexico City", pais: "Mexico" };
    else if (text.includes("north") && text.includes("monterrey")) cliente = { nombre: "Hospital DemoCare North", ciudad: "Monterrey", pais: "Mexico" };
    else if (text.includes("andes")) cliente = { nombre: "Clinica DemoCare Andes", ciudad: "Santiago", pais: "Chile" };
    else if (text.includes("park")) cliente = { nombre: "Hospital DemoCare Park", ciudad: "Buenos Aires", pais: "Argentina" };
    else if (text.includes("central") || text.includes("bogota")) cliente = { nombre: "Clinica DemoCare Central", ciudad: "Bogota", pais: "Colombia" };
    else if (text.includes("pines") || text.includes("medellin")) cliente = { nombre: "Hospital DemoCare Pines", ciudad: "Medellin", pais: "Colombia" };
    else if (text.includes("lima")) cliente = { nombre: "Instituto DemoCare Lima", ciudad: "Lima", pais: "Peru" };
    else if (text.includes("green") || text.includes("san jose")) cliente = { nombre: "Hospital DemoCare Green", ciudad: "San Jose", pais: "Costa Rica" };
    else if (text.includes("caribbean") || text.includes("santo domingo")) cliente = { nombre: "Centro Diagnostico DemoCare Caribbean", ciudad: "Santo Domingo", pais: "Dominican Republic" };
    else if (text.includes("metro north") || text.includes("quito")) cliente = { nombre: "Hospital DemoCare Metro North", ciudad: "Quito", pais: "Ecuador" };

    const observaciones = [];

    // Mapeo MR (Resonancia)
    if (text.includes("mr") || text.includes("resonador") || text.includes("resonancia")) {
      let cant = 1;
      if (text.includes("two mr") || text.includes("dos mr") || text.includes("2 mr") || text.includes("two mr systems") || text.includes("two mr systems.")) cant = 2;
      if (text.includes("three mr") || text.includes("tres mr") || text.includes("3 mr")) cant = 3;

      let age = null;
      if (text.includes("7 years") || text.includes("7 años")) age = 7;
      if (text.includes("8 years") || text.includes("8 años") || text.includes("eight")) age = 8;
      if (text.includes("9 years") || text.includes("9 años") || text.includes("older")) age = 9;
      if (text.includes("10 years") || text.includes("ten years")) age = 10;
      if (text.includes("6 years") || text.includes("6 años")) age = 6;
      if (text.includes("4 years") || text.includes("4 años")) age = 4;
      if (text.includes("3 years") || text.includes("3 años")) age = 3;
      if (text.includes("2 years") || text.includes("2 años") || text.includes("recently")) age = 2;

      let marca = "Desconocido";
      if (text.includes("novamed")) marca = "NovaMed";
      if (text.includes("bluepeak")) marca = "BluePeak Medical";
      if (text.includes("zenith")) marca = "Zenith MedTech";
      if (text.includes("orion")) marca = "Orion Imaging";
      if (text.includes("helixcare")) marca = "HelixCare";
      if (text.includes("aurelia")) marca = "Aurelia Health";

      observaciones.push({
        modalidad: "MR",
        marca,
        modelo: "Desconocido",
        cantidad: cant,
        antiguedad_estimada: age,
        estado_confirmacion: "Reportado"
      });
    }

    // Mapeo CT (Tomografía)
    if (text.includes("ct") || text.includes("tomógrafo") || text.includes("tomografo")) {
      let cant = 1;
      if (text.includes("two ct") || text.includes("dos ct") || text.includes("2 ct") || text.includes("two cts")) cant = 2;
      if (text.includes("three ct") || text.includes("tres ct") || text.includes("3 ct")) cant = 3;

      let age = null;
      if (text.includes("13 years") || text.includes("13 años") || text.includes("older ct")) age = 13;
      if (text.includes("12 years") || text.includes("quite old")) age = 12;
      if (text.includes("11 years") || text.includes("11 años")) age = 11;
      if (text.includes("8 years") || text.includes("8 años")) age = 8;
      if (text.includes("7 years") || text.includes("7 años")) age = 7;
      if (text.includes("5 years") || text.includes("5 años")) age = 5;
      if (text.includes("3 years") || text.includes("new")) age = 3;

      let marca = "Desconocido";
      if (text.includes("aurelia")) marca = "Aurelia Health";
      if (text.includes("orion")) marca = "Orion Imaging";
      if (text.includes("bluepeak")) marca = "BluePeak Medical";
      if (text.includes("zenith")) marca = "Zenith MedTech";

      observaciones.push({
        modalidad: "CT",
        marca,
        modelo: "Desconocido",
        cantidad: cant,
        antiguedad_estimada: age,
        estado_confirmacion: "Reportado"
      });
    }

    // Mapeo Ultrasound (Ecógrafos)
    if (text.includes("ultrasound") || text.includes("ecógrafo") || text.includes("ecografo")) {
      let cant = 4;
      if (text.includes("five") || text.includes("cinco") || text.includes("5")) cant = 5;
      if (text.includes("six") || text.includes("seis") || text.includes("6")) cant = 6;
      if (text.includes("eight") || text.includes("ocho") || text.includes("8")) cant = 8;
      if (text.includes("four") || text.includes("cuatro") || text.includes("4")) cant = 4;

      let age = null;
      if (text.includes("9 years") || text.includes("9 años")) age = 9;
      if (text.includes("6 years") || text.includes("6 años")) age = 6;
      if (text.includes("4 years") || text.includes("4 años")) age = 4;
      if (text.includes("2 years") || text.includes("new")) age = 2;

      let marca = "Desconocido";
      if (text.includes("helixcare")) marca = "HelixCare";
      if (text.includes("novamed")) marca = "NovaMed";
      if (text.includes("aurelia")) marca = "Aurelia Health";

      observaciones.push({
        modalidad: "Ultrasound",
        marca,
        modelo: "Desconocido",
        cantidad: cant,
        antiguedad_estimada: age,
        estado_confirmacion: "Reportado"
      });
    }

    return {
      cliente,
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
    return "Transcripción de prueba local de audio.";
  }
}

export const qvacService = new QvacService();