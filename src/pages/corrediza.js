import { mountDoorPage } from '../ui/doorPage.js';
import { createCorrediza } from '../viewers/corrediza.js';

const { viewer, rig } = mountDoorPage({
  familia: 'corrediza', nombre: 'Puerta corrediza', poster: 'img/puertas/corrediza.webp',
  createViewer: (stage) => createCorrediza(stage),
});

// Tapa del riel: control propio de esta puerta. También se abre tocando la tapa en el modelo.
const btn = document.querySelector('#coverBtn'), live = document.querySelector('#live');
if (viewer) {
  viewer.onCover((open) => { btn.setAttribute('aria-pressed', open); btn.textContent = open ? 'Bajar tapa' : 'Levantar tapa'; live.textContent = open ? 'Tapa del riel levantada' : 'Tapa del riel abajo'; });
  btn.onclick = () => {
    const open = !viewer.coverOpen; viewer.setCover(open);
    if (open && rig.current === 'general') rig.go('tapa'); if (!open && rig.current === 'tapa') rig.go('general');
  };
}
