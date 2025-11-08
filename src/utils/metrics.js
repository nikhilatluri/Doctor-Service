const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000, 2000, 5000]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const doctorsCreatedTotal = new client.Counter({
  name: 'doctors_created_total',
  help: 'Total number of doctors created'
});

const doctorsActiveGauge = new client.Gauge({
  name: 'doctors_active_total',
  help: 'Total number of active doctors'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(doctorsCreatedTotal);
register.registerMetric(doctorsActiveGauge);

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  doctorsCreatedTotal,
  doctorsActiveGauge
};
