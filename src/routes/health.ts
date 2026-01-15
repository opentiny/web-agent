// Health check routes
import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';

const router: IRouter = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      name: '@opentiny/NEXT-web-agent',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        sessions: '/api/v1/webmcp/list',
        remoters: '/api/v1/webmcp/remoter',
        tools: '/api/v1/webmcp/tools',
        sse: '/api/v1/webmcp/sse',
        messages: '/api/v1/webmcp/messages',
        mcp: '/api/v1/webmcp/mcp',
        metrics: '/health/metrics',
      },
    };

    res.json({
      success: true,
      data: systemInfo,
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYSTEM_INFO_ERROR',
        message: '获取系统信息失败',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// Detailed health check
router.get('/detailed', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});

// 性能监控管理接口
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const performanceData = {};
    const monitoringData = {};

    // 获取系统级性能指标
    const systemMetrics = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      node: {
        versions: process.versions,
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        performance: performanceData,
        monitoring: monitoringData,
        system: systemMetrics,
        collectTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: '获取性能指标失败',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
