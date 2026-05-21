# 🛠️ ScreenForge: Workspace Documentation

ScreenForge es una suite premium de diseño de producto y animación digital 3D que consta de dos herramientas principales independientes: **Mockup Studio** y **Device Animation**. A continuación se detallan todas las características y funcionalidades específicas de cada herramienta para facilitar su mantenimiento, desarrollo y uso.

---

## 📸 1. Mockup Studio

Mockup Studio está diseñado para crear composiciones estáticas premium, ideal para la presentación de capturas de pantallas de productos en dispositivos realistas con perspectivas 3D, sombras avanzadas y fondos armonizados.

### 🌟 Funcionalidades Clave

*   **Beautify (Optimización Inteligente con 1 Clic):**
    *   Aplica de forma automática una composición equilibrada optimizando la posición (`X` e `Y`), el ángulo de inclinación (`Tilt`), el tamaño de la sombra y asignando el fondo perfecto para la escena.
*   **8 Presets de Diseño (Layout Presets):**
    *   *Centered:* Vista limpia y centralizada.
    *   *Hero:* Escala aumentada y descentrado hacia la base para resaltar el contenido principal.
    *   *Corner:* Inclinación rotada a la izquierda con profundidad.
    *   *Floating:* Simulación de dispositivo flotante con barra de sombra proyectada debajo.
    *   *Minimal:* Vista frontal plana, tamaño pequeño y fondo neutro.
    *   *Dramatic:* Inclinación exagerada con rotación opuesta en el eje Y.
    *   *Showcase:* Superposición clásica de dos pantallas.
    *   *Split:* Disposición paralela limpia para dos pantallas (Dual Screen).
*   **Controles de Cámara Virtual (Estilo Shots.so):**
    *   *Zoom:* Control de escala digital ajustable del 30% al 130% con chips de selección rápida (40%, 60%, 75%, 90%, 110%).
    *   *Precision Mode:* Modifica dinámicamente el rango del control de zoom (acotando los límites a ±12% del valor actual con saltos de 0.5%) permitiendo un ajuste milimétrico de la composición.
    *   *Posicionamiento X / Y:* Desplazamiento libre del dispositivo en el canvas (hasta ±45% de las dimensiones relativas).
    *   *Tilt 3D (Inclinación):* Ajuste fino de rotación en los ejes X y Y (hasta ±15°) para simular ángulos de cámara realistas y profundidad en perspectiva.
    *   *Shadow (Sombra de Profundidad):* Control deslizante de la opacidad de la sombra del dispositivo para acentuar el efecto de suspensión.
*   **Configuración de Dispositivo:**
    *   *Soporte Multimodelo:* Selector intuitivo entre iPhone 17 Pro, iPhone 16 Pro, MacBook Pro, Browser (Navegador Genérico) y Frameless (Imagen sin marco).
    *   *Single vs Dual Screen:* En modelos de iPhone, permite alternar entre un único dispositivo o dos a la vez.
    *   *Dual Screen Layouts:* Si se activan dos pantallas, permite elegir tres orientaciones diferentes:
        *   *Offset:* Desplazamiento diagonal y superposición tridimensional.
        *   *Side:* Disposición simétrica izquierda-derecha.
        *   *Stack:* Disposición apilada verticalmente con ligera rotación opuesta en el eje Z (Z-index dinámico).
    *   *Frame Color (Colores de chasis):* 8 colores premium aplicables al hardware del dispositivo: *Space Black, Space Gray, Silver, Midnight, Starlight, Natural Titanium, Titanium Blue, Gold*.
*   **Catálogo de Fondos (Gradients & Colors puros CSS):**
    *   *Cosmic:* Aurora, Nebula, Midnight, Void.
    *   *Mystic:* Soft, Lavender, Haze, Rose.
    *   *Abstract:* Ember, Forest, Ocean, Slate.
    *   *Radiant:* Solar, Glow, Frost, Carbon.
    *   *Dark:* Pure, Zinc, Indigo, Green.
*   **Exportación Profesional:**
    *   *Modos de Exportación:*
        *   *Full Canvas:* Exporta el fondo completo junto con el dispositivo.
        *   *Device Only:* Exporta el dispositivo con fondo transparente para diseño en overlays.
        *   *Tight Crop:* Recorta la imagen estrictamente a los límites del dispositivo conservando la transparencia externa.
    *   *Multiplicador de Resolución:* Exporta PNG en resolución estándar (1x), alta definición (2x) o ultra alta definición (3x).

---

## 🎬 2. Device Animation (Cinematic Studio)

Device Animation es una herramienta interactiva de autoría de video y secuencias multicámara que te permite crear animaciones, transiciones continuas, recorridos de pantalla y prototipos interactivos en tiempo real.

### 🌟 Funcionalidades Clave

*   **Línea de Tiempo Multiescena (Studio Timeline):**
    *   Soporte para añadir y organizar múltiples escenas independientes de forma secuencial en una línea de tiempo horizontal.
    *   Modificación de la duración individual de cada escena directamente desde la barra de propiedades o arrastrando clips en el timeline.
    *   *Playhead interactivo:* Barra de reproducción que permite desplazarse (scrubbing) a través de la línea de tiempo global.
    *   *Resizer interactivo del Timeline:* Permite personalizar el tamaño vertical del área de trabajo (arrastre vertical con bloqueo de selección de texto).
*   **Sistema de Textos Cinematográficos (Text Layers):**
    *   *Capas de Texto Independientes:* Añade múltiples bloques de texto (estilos gradiente, sólidos, etc.) que flotan sobre la composición de video.
    *   *Pistas Dinámicas (Tracks):* Cada texto añadido crea automáticamente su propia pista (Track 1, Track 2...) en la línea de tiempo, permitiendo sobreponer y organizar capas sin cruces.
    *   *Ajuste de Tiempo:* Los textos se ajustan en el tiempo moviendo los límites de sus clips (Start Time y Duration) para que coincidan perfectamente con momentos clave de la animación.
    *   *Animación de Entrada (Entrance Animations):* El motor renderiza animaciones ultra-sincronizadas para el exporte (Fade In, Bounce elástico, Slide Up y Typewriter/Máquina de escribir carácter a carácter).
*   **Virtual Camera por Escena:**
    *   Cada escena guarda su propia configuración independiente de cámara: *Zoom, Pan X, Pan Y, Tilt X, Tilt Y, Rotation (Z-rot) y Focus Blur (Desenfoque de lente)*.
    *   *Presets de cámara rápida:* Reset, Zoom Top (Enfoque superior), Zoom Bottom (Enfoque inferior), Wide (Gran angular), Side Left (Diagonal izquierda), Side Right (Diagonal derecha).
    *   *Camera Speed Multiplier:* Multiplica la velocidad de transición de la cámara (de 0.1x a 3x) entre escena y escena.
*   **Tres Modos de Operación por Escena (Scene Modes):**
    1.  **Animation Mode:**
        *   Permite definir movimientos fluidos mediante el motor de animaciones de Framer Motion.
        *   *9 presets de animación de entrada/bucle:* None, Cinematic Reveal, Floating (efecto bucle de levitación), Orbit (rotación de 180°), Dolly Zoom (escalado con desenfoque de lente), Camera Pan, Parallax (paneo continuo en bucle), Perspective Reveal (aparición oblicua en 3D), Startup Launch, Focus Blur.
        *   *Easing dinámico:* Transiciones configurables con curvas físicas como *Spring (física de resorte ajustable), Ease Out, Ease In Out, Anticipate, Bounce (efecto rebote), y Linear*.
    2.  **Scroll Mode (Recorrido de Capturas Largas):**
        *   Permite cargar capturas verticales muy largas (ej. páginas web completas).
        *   *Sincronización de velocidad:* El scroll calcula el recorrido total de principio a fin ajustado exactamente a la duración asignada a la escena.
        *   *Animación controlada:* El scroll solo avanza cuando se inicia la reproducción global de la animación (Play/Play All).
        *   *Optimización visual:* Implementa `background-size: cover;` eliminando bandas oscuras en los laterales de pantallas móviles.
*   **Gestión de Capas e Iluminación (Layers & Lighting):**
    *   *Lighting Panel:* Controla la iluminación ambiental, intensidad de brillos y la iluminación de contorno del dispositivo (Rim Light).
    *   *Layer List:* Lista que permite activar/desactivar y controlar la opacidad individual de las capas virtuales: *Glow (Gradiente de brillo trasero), Shadow (Sombra de base) y Device (Chasis y pantalla)*.
*   **Persistencia en Base de Datos Local (LocalStorage Engine):**
    *   Guardado automático en tiempo real de todos tus avances y configuraciones.
    *   El motor convierte las imágenes cargadas por el usuario a Base64 en tiempo real para almacenarlas en el navegador de manera persistente. Al recargar la pestaña (`F5` o reabrir el navegador), el proyecto completo, las escenas, la cámara y las imágenes vuelven exactamente al último estado de edición.

---

## 🏗️ Arquitectura Modular del Código

El código de **Device Animation** está estructurado bajo los siguientes componentes modulares:
*   `page.tsx`: Orquestador principal de estados que administra la reproducción global, escenas, persistencia con LocalStorage e inicialización de constantes.
*   `CanvasArea.tsx`: Componente especializado y optimizado para la renderización tridimensional y visualización interactiva del dispositivo, sombras, capas y overlays de imágenes.
*   `StudioTimeline.tsx`: Componente UI que renderiza los canales (Tracks), el ruler de segundos, los clips de escenas editables y el playhead móvil.
*   `LeftSidebar.tsx`: Inspector de configuración física (Cámara, Dispositivos, Iluminación, Fondos y Capas).
*   `RightSidebar.tsx`: Inspector contextual por escena activa (Animaciones, Modos de pantalla, Transiciones de cámara y edición de Hotspots).
*   `types.ts`: Declaración de tipos fuertemente tipados en TypeScript de todas las propiedades de escena y cámara.

---

## 🎞️ Pipeline de Exportación de Video (Device Animation)

### Arquitectura General

La exportación de video en Device Animation sigue un pipeline de **captura DOM frame-a-frame** en lugar de un renderizado 3D independiente. Esto garantiza **fidelidad pixel-perfect**: el video exportado es exactamente lo que el usuario ve en el workspace (background real, device frame CSS correcto, text layers, animaciones).

```
ExportDialog (settings) ──► videoExporter.ts ──► ExportRenderer.ts (html2canvas)
                                │                          │
                                │    frame PNG Blob ◄──────┘
                                ▼
                          ffmpeg.wasm (libx264)
                                │
                                ▼
                           output.mp4
```

### Por qué se usa `html2canvas` y no `html-to-image`

`html-to-image` serializa el DOM a SVG con `<foreignObject>` y luego carga ese SVG como una imagen. Esto tiene dos problemas críticos:

1. **`SecurityError: Not allowed to access cross-origin stylesheet`** — `html-to-image` intenta leer las reglas CSS de Google Fonts desde `document.styleSheets`, lo cual el navegador bloquea (CORS). Ocurría en cada frame y ralentizaba el export.
2. **`Not allowed to load local resource: data:image/svg+xml`** — Chrome/WebKit bloquea los SVGs con `<foreignObject>` cargados como `img.src` por política de seguridad. Crasheaba en el frame ~66 (cuando el SVG era lo suficientemente grande).

`html2canvas` evita ambos problemas: camina el DOM y pinta cada elemento directamente en un `<canvas>` 2D, sin SVG, sin acceso a stylesheets, sin data-URLs intermedias.

### Cómo se garantiza la calidad y la independencia del tamaño de ventana

```ts
// ExportRenderer.ts
const scale = targetWidth / element.offsetWidth;
await html2canvas(element, { scale, width: elementW, height: elementH, ... });
```

Al pasar `scale = targetW / elementW`, `html2canvas` renderiza su canvas interno ya en la resolución de destino (ej. 1920×1080). Así:
- **No importa si la ventana del browser está minimizada** — el output tiene la misma resolución.
- **No hay upscaling pixelado** — se captura a la resolución final desde el principio.

### Transición entre escenas durante el export

Durante el export, el componente `CanvasArea` cambia su comportamiento de animación para evitar que `AnimatePresence` con `mode="wait"` bloquee la aparición de la escena 2:

| Modo preview | Modo export |
|---|---|
| `AnimatePresence mode="wait"` — espera que la animación de salida termine | `AnimatePresence mode="sync"` — transición inmediata |
| `initial="initial"` — anima desde el estado inicial | `initial={false}` — monta directamente en el estado final |
| `key={sceneId + animKey}` — se remonta en replay | `key={sceneId}` — solo se remonta al cambiar de escena |

Además, el callback `onSeekFrame` **no incrementa `animKey`** durante el export. Incrementarlo causaba que el `motion.div` se remontara 180 veces (una por frame), reiniciando la animación de entrada en cada frame e impidiendo que la escena 2 apareciera.

### Loop de frames (videoExporter.ts)

```
for cada frame i de 0 a totalFrames:
  1. onSeekFrame(i/fps)           → setCurrentTime(t)  [React state]
  2. waitForPaint()               → 2x requestAnimationFrame (React repinta)
  3. renderer.captureFrame()      → html2canvas → PNG Blob
  4. ffmpeg.writeFile(frame_XXXX.png, blob)
  5. onProgress(rendering, (i+1)/total, i+1, total)
```

### Encoding con FFmpeg.wasm

```bash
ffmpeg -framerate {fps} -i frame_%04d.png \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -preset ultrafast \   # Balance óptimo velocidad/calidad (era 'slow', 10x más lento)
  -crf {14|18|23} \     # Ultra=14, High=18, Standard=23
  -vf scale={w}:{h}:flags=lanczos \
  output.mp4
```

**¿Por qué `ultrafast` y no `slow`?** La diferencia de calidad visual a resoluciones de pantalla típicas es imperceptible, pero la velocidad de encoding se reduce de ~60s a ~6s para un video de 6s a 30fps.

### Opciones de exportación disponibles

| Opción | Valores | Defecto |
|---|---|---|
| Resolución | 720p (1280×720), 1080p (1920×1080), 1440p (2560×1440), 4K (3840×2160) | 1080p |
| FPS | 24 (cinemático), 30 (estándar), 60 (suave) | 30 |
| Calidad de encode | Standard (CRF 23), High (CRF 18), Ultra (CRF 14) | Ultra |

### Performance y limitaciones conocidas

- **Tiempo estimado**: ~200–700ms por frame dependiendo de la resolución target. Un video de 6s a 30fps = 180 frames → ~1–3 minutos.
- **Consumo de RAM**: html2canvas crea un canvas interno de la resolución target. Para 4K (3840×2160) esto puede consumir ~300MB de RAM; usar con precaución.
- **Animaciones de entrada**: Durante el export, los dispositivos aparecen directamente en su estado final (sin animación de entrada). Las animaciones continuas (floating-drift, ambient-motion) sí se capturan frame-a-frame.
- **Google Fonts**: Los fonts ya están cargados en la página, por lo que html2canvas los usa correctamente sin necesitar acceder a las stylesheets de Google.
- **Fondos con radial-gradient/linear-gradient**: html2canvas soporta ambos tipos de gradientes CSS correctamente.

### Archivos del pipeline

```
src/lib/export/
├── ExportRenderer.ts     ← Captura DOM → PNG Blob (html2canvas)
├── videoExporter.ts      ← Orquestación frame loop + FFmpeg encoding
└── ffmpeg.ts             ← Inicialización lazy de FFmpeg.wasm

src/components/export/
├── ExportDialog.tsx      ← Modal de configuración (resolución, FPS, calidad)
└── ExportProgress.tsx    ← UI de progreso con timer, ms/frame y estado de error
```

