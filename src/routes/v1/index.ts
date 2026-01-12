// API v1 routes entry point
import { Router, type IRouter } from 'express';
import webmcpRoutes from './webmcp';

const router: IRouter = Router();

router.use('/webmcp', webmcpRoutes);

export default router;
