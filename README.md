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

## Estructura

- `deploy/`: versión publicada de la aplicación y sus recursos PWA.
- `work/`: plantilla, scripts auxiliares y fuentes de apoyo que se pueden descargar localmente.
- `outputs/`: copia exportable del HTML final y recursos asociados.

No subas credenciales ni la carpeta local `.vercel/`. Los cambios publicados por GitHub/Vercel actualizan el sitio, pero los datos locales guardados por cada usuario no se sincronizan automáticamente entre dispositivos.
