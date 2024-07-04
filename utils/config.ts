import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';

import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export const exporterOptions = {
  url: 'https://ingest.in.signoz.cloud:443/v1/traces', // use your own data region
  headers: { 'signoz-access-token': '854b93c8-ee1e-4778-9455-d097874eeed8' }, // Use if you are using SigNoz Cloud
};

export const resourceSettings = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'nextjs-optel-example-5',
  [SEMRESATTRS_SERVICE_VERSION]: '0.0.5',
});

export const traceExporter = new OTLPTraceExporter(exporterOptions);
