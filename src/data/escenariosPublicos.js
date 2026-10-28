// Escenarios deportivos que el SEDEDE tiene a su custodia.
// Fuente: TarifarioIngresosSeeder.php (rama dev del backend), que transcribe la
// RAG CH/N.º 011/2024. `detalle` lista solo espacios deportivos de ese seeder.
//
// `imagen` = nombre del archivo (SIN extensión) en src/assets/images/escenarios/
// (.jpg .jpeg .png .webp). Si no existe, la card muestra el degradado rojo.
//
// PENDIENTE de confirmar con Planificación: el cuadro de precios nombra un
// «Coliseo Rafael Rodríguez» que el seeder asume es Evo Morales Ayma II renombrado.
export const escenariosDestacados = [
  {
    id: 1,
    nombre: 'Estadio Patria',
    detalle: 'Óvalo central, cancha auxiliar de césped natural, cancha sintética, pista atlética de tartán, área de calistenia y frontones A, B y C',
    imagen: 'estadio-patria',
  },
  {
    id: 2,
    nombre: 'Coliseo Tercera Fase',
    detalle: 'Óvalo central de parquet, vóleibol, 14 canchas de ráquetbol, bádminton y ambientes de billar, tenis de mesa, karate, zambo y lucha olímpica',
    imagen: 'coliseo-tercera-fase',
  },
  {
    id: 3,
    nombre: 'Coliseo Jorge Revilla Aldana',
    detalle: 'Óvalo central (futsal y vóleibol) y canchas auxiliares A, C y D',
    imagen: 'coliseo-jorge-revilla-aldana',
  },
  { id: 4, nombre: 'Coliseo Tito Alfred', detalle: 'Cancha principal', imagen: 'coliseo-tito-alfred' },
  { id: 5, nombre: 'Coliseo Evo Morales Ayma I', detalle: 'Cancha principal', imagen: 'coliseo-evo-morales-1' },
  { id: 6, nombre: 'Coliseo Evo Morales Ayma II', detalle: 'Cancha principal', imagen: 'coliseo-evo-morales-2' },
  { id: 7, nombre: 'Coliseo Evo Morales Ayma III', detalle: 'Cancha principal', imagen: 'coliseo-evo-morales-3' },
  { id: 8, nombre: 'Coliseo Esteban Urquizu Cuéllar', detalle: 'Cancha principal', imagen: 'coliseo-esteban-urquizu' },
  { id: 9, nombre: 'Campo de Tiro Deportivo Santiago Arana', detalle: 'Campo de tiro', imagen: 'campo-de-tiro-santiago-arana' },
  { id: 10, nombre: 'Campo Deportivo Tenis La Madona', detalle: 'Canchas de tenis, squash y frontón', imagen: 'tenis-la-madona' },
]
