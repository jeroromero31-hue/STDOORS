import { mountDoorPage } from '../ui/doorPage.js';
import { mountCdsSections } from '../ui/cdsPage.js';
import { createCDS } from '../viewers/cds.js';

mountDoorPage({
  familia: 'cds', nombre: 'Puertas CDS Legacy (juego de 3)', poster: 'img/puertas/cds.webp', section: 'cds',
  createViewer: (stage) => createCDS(stage),
});
mountCdsSections();
