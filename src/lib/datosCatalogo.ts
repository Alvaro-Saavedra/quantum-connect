export const catalogoQuantum = {
  nexus: {
    modelo: "Nexus",
    tipo: "Auto urbano eléctrico",
    precio: {
      base: 15000,
      moneda: "USD",
      rango: "15000 - 18000"
    },
    autonomia: "180 km",
    velocidadMaxima: "80 km/h",
    tiempoCarga: "6-8 horas (carga lenta), 1 hora (carga rápida)",
    bateria: "Litio-ion 12 kWh",
    motor: "Potencia máxima 15 kW (20 hp)",
    dimensiones: {
      largo: "2800 mm",
      ancho: "1500 mm", 
      alto: "1600 mm",
      distanciaEntreEjes: "1800 mm"
    },
    capacidad: "2 pasajeros + carga",
    caracteristicas: [
      "Techo solar panorámico",
      "Pantalla táctil 8\"",
      "Conectividad Bluetooth y USB",
      "Aire acondicionado eléctrico",
      "Frenos regenerativos",
      "Modo ECO y Sport"
    ],
    garantia: "3 años o 60,000 km (lo que ocurra primero)",
    usoRecomendado: "Movilidad urbana, desplazamientos diarios, uso comercial ligero"
  },
  e4_montanero: {
    modelo: "E4 Montañero",
    tipo: "Camioneta eléctrica todo terreno",
    precio: {
      base: 22000,
      moneda: "USD",
      rango: "22000 - 28000"
    },
    autonomia: "220 km",
    velocidadMaxima: "90 km/h",
    tiempoCarga: "8-10 horas (carga lenta), 1.5 horas (carga rápida)",
    bateria: "Litio-ion 18 kWh",
    motor: "Potencia máxima 25 kW (34 hp), torque 180 Nm",
    dimensiones: {
      largo: "3200 mm",
      ancho: "1650 mm",
      alto: "1750 mm",
      distanciaEntreEjes: "2100 mm",
      alturaDesdeSuelo: "200 mm"
    },
    capacidad: "5 pasajeros o 800 kg de carga",
    caracteristicas: [
      "Tracción integral eléctrica",
      "Suspensión neumática ajustable",
      "Neumáticos todo terreno",
      "Protección subchasis",
      "Winch eléctrico delantero (opcional)",
      "Iluminación LED full",
      "Pantalla digital 10\"",
      "Conectividad avanzada"
    ],
    garantia: "3 años o 50,000 km (lo que ocurra primero)",
    usoRecomendado: "Terrenos difíciles, trabajo rural, transporte de carga ligera, aventuras off-road"
  },
  camion_ion: {
    modelo: "Camión ION",
    tipo: "Vehículo de carga eléctrica",
    precio: {
      base: 35000,
      moneda: "USD",
      rango: "35000 - 45000"
    },
    autonomia: "150 km",
    velocidadMaxima: "70 km/h",
    tiempoCarga: "10-12 horas (carga lenta), 2 horas (carga rápida)",
    bateria: "Litio-ion 25 kWh",
    motor: "Potencia máxima 30 kW (40 hp), torque 250 Nm",
    dimensiones: {
      largo: "4200 mm",
      ancho: "1800 mm",
      alto: "1950 mm",
      distanciaEntreEjes: "2500 mm",
      alturaCaja: "1100 mm"
    },
    capacidad: "1000 kg de carga útil",
    caracteristicas: [
      "Caja de carga metálica con toldo",
      "Puerta trasera hidráulica",
      "Sistema de gestión de flota",
      "Pantalla de control 7\"",
      "Cámara de reversa",
      "Sensor de proximidad trasero",
      "Iluminación de carga LED",
      "Puertos de poder externos 12V/24V"
    ],
    garantia: "2 años o 40,000 km (lo que ocurra primero)",
    usoRecomendado: "Distribución urbana, entregas de última milla, servicios municipales"
  },
  // Motocicletas eléctricas (agregadas basado en el feedback del usuario)
  ts_street_hunter_pro: {
    modelo: "TS Street Hunter Pro",
    tipo: "Motocicleta eléctrica deportiva",
    precio: {
      base: 6514,
      moneda: "USD",
      equivalenteBs: 45600
    },
    autonomia: "85-150 km",
    velocidadMaxima: "85-90 km/h",
    tipoVehiculo: "motocicleta"
  },
  tc_wanderer_pro: {
    modelo: "TC Wanderer Pro",
    tipo: "Motocicleta eléctrica todoterreno",
    precio: {
      base: 6071,
      moneda: "USD",
      equivalenteBs: 42500
    },
    autonomia: "80-100 km",
    velocidadMaxima: "85 km/h",
    tipoVehiculo: "motocicleta"
  },
  ts_street_hunter: {
    modelo: "TS Street Hunter",
    tipo: "Motocicleta eléctrica urbana",
    precio: {
      base: 5900,
      moneda: "USD",
      equivalenteBs: 41300
    },
    autonomia: "60-85 km",
    velocidadMaxima: "80 km/h",
    tipoVehiculo: "motocicleta"
  }
};