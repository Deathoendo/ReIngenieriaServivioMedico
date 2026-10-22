import { Router } from 'express';
import * as controller from '../controllers/consulta.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Todas las rutas del módulo exigen sesión válida.
router.use(requireAuth);

// Catálogos primero: si estas rutas quedaran después de `/:id`, la petición
// `/catalogos` entraría por `/:id` y fallaría al validar "catalogos" como entero.
router.get('/catalogos', asyncHandler(controller.catalogos));
router.get('/cargos', asyncHandler(controller.cargos));
router.get('/vicepresidencias', asyncHandler(controller.vicepresidencias));
router.get('/medicamentos', asyncHandler(controller.medicamentos));
router.get('/lotes', asyncHandler(controller.lotes));
router.get('/colaborador/:cedula', asyncHandler(controller.colaborador));

router.get('/buscar', asyncHandler(controller.buscar));
router.post('/', asyncHandler(controller.crear));
router.get('/:id', asyncHandler(controller.obtener));
router.put('/:id', asyncHandler(controller.actualizar));
router.delete('/:id', asyncHandler(controller.eliminar));

export default router;
