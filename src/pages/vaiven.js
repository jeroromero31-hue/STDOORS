import { mountDoorPage } from '../ui/doorPage.js';
import { createVaiven } from '../viewers/vaiven.js';

mountDoorPage({
  familia: 'vaiven', nombre: 'Puerta vaivén', poster: 'img/puertas/vaiven.webp',
  createViewer: (stage, reg) => createVaiven(stage, reg),
});
