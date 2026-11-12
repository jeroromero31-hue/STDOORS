import { mountDoorPage } from '../ui/doorPage.js';
import { createAbatible } from '../viewers/abatible.js';
import { url } from '../ui/site.js';

mountDoorPage({
  familia: 'abatible', nombre: 'Puerta abatible', poster: 'img/puertas/abatible.webp',
  createViewer: (stage, reg) => createAbatible(stage, reg, { logoUrl: url('img/marca/st-logo-azul.webp') }),
});
