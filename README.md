# Atlas INFOADE

Aplicación web progresiva (PWA) para organizar el curso de INFOADE 3.º UAH. La app está en `deploy/` y funciona sin frameworks ni paso de compilación. Los datos de usuario se guardan localmente en el navegador; cada dispositivo mantiene su propia copia.

## Probar y publicar

- Abre `deploy/index.html` para una vista local básica. La instalación PWA, las notificaciones y algunas funciones offline requieren servir la carpeta `deploy/` por HTTPS (o desde `localhost`).
- Para Vercel, importa este repositorio y establece `deploy` como directorio raíz del proyecto. No hace falta comando de build.
- La fuente principal de la interfaz está en `work/dashboard_template.html`; los datos completos de asignaturas están embebidos en `deploy/index.html`.

## Editar y regenerar

En Windows PowerShell, desde la raíz del proyecto:

```powershell
./work/build_dashboard.ps1
```

El script usa los datos de asignaturas de `deploy/index.html` y genera `outputs/dashboard_academico_3ero.html` y una nueva `deploy/index.html`. Los recursos PWA (iconos, fuentes, gráfico y service worker) están en `deploy/`.

Las guías docentes pueden descargarse localmente (no se incluyen en el repositorio porque algunos documentos contienen datos personales de terceros):

```powershell
./work/fetch_uah_guides.ps1
```

El script opcional `work/process_logo.py` genera iconos a partir de una imagen de origen; requiere Python con Pillow y recibe la ruta de la imagen como argumento.

## Asistente de IA local

El botón **✦ Asistente** de la cabecera (o `Alt+I`) abre un chat en lenguaje natural sobre el curso: «¿qué tengo que hacer hoy?», «¿cuándo es el próximo examen?», «¿qué me falta por estudiar de SSOO?», «tareas pendientes», «mis notas»… Código en `deploy/assistant.js` (y `deploy/ai-worker.js` para el modelo WebGPU).

- **Datos exactos sin IA**: un planificador lee el estado de Atlas (horario, tareas, exámenes con fecha, notas) y el avance del portal de estudio. Fechas y días que faltan los calcula el código, nunca el modelo. Recomienda preparar el examen más próximo con los temas de menor avance y botones directos al portal de estudio.
- **Con la IA activada** (chip «IA desactivada» → ajustes) el modelo añade un consejo a cada plan y contesta preguntas libres, incluso sobre el temario, apoyándose en esos datos y en extractos de `study/*.json`.
- **Motores gratuitos y locales** (como en Paper Reader): IA integrada de Chrome/Edge, modelo WebGPU de WebLLM (descarga única de 0,9 a 6,4 GB, solo tras activarlo) o tu propio Ollama/LM Studio. Nada se envía a una API de pago. Los ajustes se guardan en `localStorage` (`atlas.ai-*`), por dispositivo, y no se sincronizan.
- Los datos se leen de las mismas estructuras que ya usa Atlas, así que cualquier examen o tarea nueva aparece en las respuestas sin cambios.
- El service worker ignora las peticiones a otros orígenes para no copiar a su caché los modelos de IA.

## Guía de estudio del examen de SSOO

Página independiente en `#ssoo` (o `/ssoo`), con botón en el lobby de SSOO del portal de estudio y acceso desde el asistente («Guía del examen de SSOO»). Código en `deploy/ssoo-examen.js`; contenido en `deploy/ssoo-examen/*.json` (`meta`, `teoria`, `practica`, `simulacros`, `plan`), que es la fuente editable.

- **Inicio**: formato conocido del examen (teoría y práctica separadas), aviso de que procede de un compañero y puede cambiar, lo que no se sabe (fecha, duración, penalización, temario oficial, nº de preguntas test), fuentes y limitaciones.
- **Teoría**: mapa de temas con los epígrafes de las diapositivas, conceptos con relaciones, glosario, comparativas, banco de test con explicación, propuestas de desarrollo (esquema oculto + rúbrica) y estrategia para la pregunta de 2 puntos.
- **Práctica** (solo Práctica 1, incidencias 1–4; la minishell no entra): objetivos y conceptos examinables, órdenes (con «modo memoria»), ejemplos, ejercicios con solución razonada oculta, errores frecuentes y distinciones clave con la página donde aparecen.
- **Simulacros** de teoría y práctica en pantalla o **en papel** (imprimir enunciado y soluciones razonadas), con tiempos solo como sugerencia y registro de errores.
- **Plan y seguimiento**: ruta de estudio sin fechas, casillas de progreso por tema e incidencia y «errores que debo volver a practicar» con repaso.
- **Trazabilidad**: cada pieza indica su origen (*Apuntes*, *Resumen no oficial* o *Complemento*) y cita archivo y página del PDF. Los PDF **no** se incluyen en el repositorio; se pueden vincular desde Inicio → Fuentes (solo en la sesión) para que las citas los abran en la página indicada.
- **Examen tipo** en el portal de estudio: en la página de cada prueba de SSOO con formato conocido (la de teoría y la de laboratorio de la Práctica 1, ordinaria y extraordinaria) hay una pestaña «Examen tipo» que genera un simulacro con ese formato y con los temas de esa prueba (`#ssoo/simulacros/examen-teoria/t1,t2` o `examen-practica/i1,i2,i3,i4`). No aparece en otras asignaturas ni en pruebas cuyo formato no se conoce.
- El progreso se guarda en `state.ssooExam` (IndexedDB y sincronización de Atlas).

## Estructura

- `deploy/`: versión publicada de la aplicación y sus recursos PWA.
- `work/`: plantilla, scripts auxiliares y fuentes de apoyo que se pueden descargar localmente.
- `outputs/`: copia exportable del HTML final y recursos asociados.

No subas credenciales ni la carpeta local `.vercel/`. Los cambios publicados por GitHub/Vercel actualizan el sitio, pero los datos locales guardados por cada usuario no se sincronizan automáticamente entre dispositivos.
