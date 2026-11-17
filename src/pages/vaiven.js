import { mountDoorPage } from '../ui/doorPage.js';
import { createVaiven } from '../viewers/vaiven.js';
import { mountVaivenExtras } from '../ui/vaivenPage.js';

mountDoorPage({
  familia: 'vaiven', nombre: 'Puerta vaivén', poster: 'img/puertas/vaiven.webp',
  createViewer: (stage, reg) => createVaiven(stage, reg),
  extend: mountVaivenExtras,
});
