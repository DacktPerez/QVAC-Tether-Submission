# 🏥 Customer Installed Base Intelligence (Philips Hackathon)

> **"Procesamos datos médicos en el Edge más rápido de lo que metes una serie pesada en Smart Fit y sin tocar la nube centralizada."**

---

## ⚡ ¿De qué trata esta maravilla?

Cada día, la gente de campo (ingenieros, vendedores, especialistas) entra a hospitales en toda Latinoamérica y ve cosas clave: *"Mire, tienen 2 resonadores viejos y un tomógrafo nuevo"*. ¿El problema? Esa información antes terminaba perdida en notas de voz de WhatsApp, post-its o en el olvido.

Este prototipo agarra cualquier texto libre o dictado de voz, lo pasa por un modelo de Inteligencia Artificial **100% On-Device** y te genera un inventario médico estructurado, deduplicado, con nivel de confianza y alertas de renovación tecnológica **en tiempo real y sin internet**.

---

## 🚨 REQUISITO OBLIGATORIO: Cero Nube, 100% Local-First

* **Cero APIs Centralizadas:** Ni OpenAI, ni Azure, ni Google Cloud. Todo corre en la CPU/GPU local usando el SDK de QVAC (`@qvac/sdk` / `@qvac/inference`) con modelos cuantizados (`llama-3.2` y `whisper-tiny`).
* **Privacidad Nivel Dios:** Cumplimiento nativo de HIPAA y GDPR. Ningún dato sensible de infraestructura hospitalaria sale del dispositivo.
* **Persistencia Cifrada Local:** Todo se guarda en **SQLite** embebido (`better-sqlite3`).

---

## 🏗️ Arquitectura & Flujo de Datos
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               DISPOSITIVO DEL USUARIO                            │
│                                                                                  │
│           [ Entrada por Texto ]                                                  │
│                       │                                                          │
│                       ▼                                                          │
│           [ QVAC SDK (@qvac/sdk) - Edge AI Engine ]                              │
│           └─ LLM Local (Extracción JSON Estricto)                                │
│                       │                                                          │
│                       ▼                                                          │
│           [ Motor de Negocio: DataEngine ]                                       │
│           ├─ Normalización de Entidades                                          │
│           ├─ Algoritmo de Deduplicación y Merge por Modalidad                    │
│           ├─ Cálculo de Puntaje de Confianza (0 - 100%)                          │
│           └─ Generador de Preguntas de Seguimiento Automáticas                   │
│                       │                                                          │
│                       ▼                                                          │
│ [ SQLite DB Local ] ──► [ API REST Local: Express ] ──► [ Frontend React + UI ]  │
└──────────────────────────────────────────────────────────────────────────────────┘

---

## 🧠 Algoritmos & Lógica de Negocio

### 1. Score de Confianza (0 - 100%)
P_confianza = P_completitud + P_frescura + P_confirmaciones
* **Completitud (40%):** Otorga puntos si reportaste la modalidad, cantidad, marca y modelo/edad.
* **Frescura (30%):** Degrada el valor con los días transcurridos desde el último reporte.
* **Confirmaciones (30%):** Suma puntos si diferentes usuarios de campo reportan independientemente el mismo equipo.

### 2. Motor de Deduplicación Interactivo
Si vuelves a reportar *"2 resonadores"* en un hospital que ya tenía un registro previo, el sistema no duplica filas en la base de datos: consolida las cantidades, fusiona los datos faltantes y recalcula la confianza.

---

## 📊 Cobertura Regional de Latinoamérica

El sistema cubre los **20 escenarios sintéticos del dataset oficial de Philips** (`Dummy_Installed_Base_Hackathon.xlsx`) en **13 centros médicos**:

* 🇵🇦 **Panamá:** Hospital DemoCare Pacific
* 🇧🇷 **Brasil:** Hospital DemoCare Horizon (São Paulo), Clinica DemoCare Light (Campinas)
* 🇲🇽 **México:** Centro Medico DemoCare Valley (CDMX), Hospital DemoCare North (Monterrey)
* 🇨🇱 **Chile:** Clinica DemoCare Andes (Santiago)
* 🇦🇷 **Argentina:** Hospital DemoCare Park (Buenos Aires)
* 🇨🇴 **Colombia:** Clinica DemoCare Central (Bogotá), Hospital DemoCare Pines (Medellín)
* 🇵🇪 **Perú:** Instituto DemoCare Lima
* 🇨🇷 **Costa Rica:** Hospital DemoCare Green (San José)
* 🇩🇴 **República Dominicana:** Centro Diagnostico DemoCare Caribbean (Santo Domingo)
* 🇪🇨 **Ecuador:** Hospital DemoCare Metro North (Quito)

---

## 🛠️ Modus Operandi

Sigue estos sencillos pasos en tu consola para iniciar el sistema:

***1. Clonar e instalar**
```bash
git clone <tu-repositorio>
cd "Prototipo Hospital AI"
npm install
```

***2. Poblar el Dataset Oficial en SQLite**
Cargar los 20 escenarios:
```bash
node seed.js
```

***3. Iniciar el Backend Local**
En una pestaña de la terminal:
```bash
node server.js
```

***4. Iniciar el Frontend**
En una segunda pestaña de la terminal:
```bash
npm run dev
```

---

## 💡 Tips de Prueba & Utilidades

***Resetear la Base de Datos desde la Terminal:**
Si deseas reiniciar la base de datos y recargar el dataset oficial limpio:
```bash
npm run reset
```


*Diseñado con ilusión, buena música de fondo y mucho sueño :D*