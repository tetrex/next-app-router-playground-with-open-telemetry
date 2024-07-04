import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';

import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';

import { Resource } from '@opentelemetry/resources';
const {
  SEMRESATTRS_SERVICE_NAME,
} = require('@opentelemetry/semantic-conventions');
import { registerInstrumentations } from '@opentelemetry/instrumentation';

//exporters
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

//console.log(`CollectorString: ${COLLECTOR_STRING}`);

// The SemanticResourceAttributes is an enum that provides a set of predefined attribute keys for commonly used attributes in OpenTelemetry to maintain consistency across different OpenTelemetry implementations
const resourceSettings = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'nextjs-optel-example',
  [SEMRESATTRS_SERVICE_NAME]: '0.0.2',
});

// The `newRelicExporter` is an instance of OTLPTraceExporter configured to send traces to New Relic's OTPL-compatible backend.
// Make sure you have added your New Relic Ingest License to VITE_APP_NR_LICENSE env-var of your React App
const exporterOptions = {
  url: 'https://ingest.in.signoz.cloud:443/v1/traces', // use your own data region
  headers: { 'signoz-access-token': '854b93c8-ee1e-4778-9455-d097874eeed8' }, // Use if you are using SigNoz Cloud
};

const traceExporter = new OTLPTraceExporter(exporterOptions);
const provider = new WebTracerProvider({ resource: resourceSettings });

//Uncomment this to enable debugging using consoleExporter
//provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// The BatchSpanProcessor is responsible for batching and exporting spans to the configured exporter (newRelicExporter in this case).
provider.addSpanProcessor(
  new BatchSpanProcessor(
    traceExporter,
    //Optional BatchSpanProcessor Configurations
    {
      // The maximum queue size. After the size is reached spans are dropped.
      maxQueueSize: 100,
      // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      maxExportBatchSize: 50,
      // The interval between two consecutive exports
      scheduledDelayMillis: 500,
      // How long the export can run before it is cancelled
      exportTimeoutMillis: 30000,
    },
  ),
);

// ZoneContextManager is a context manager implementation based on the Zone.js library. It enables context propagation within the application using zones.
provider.register({
  contextManager: new ZoneContextManager(),
  // Configure the propagator to enable context propagation between services using the W3C Trace Headers
  propagator: new CompositePropagator({
    propagators: [new W3CBaggagePropagator(), new W3CTraceContextPropagator()],
  }),
});

const startOtelInstrumentation = () => {
  console.error(`Registering Otel ${new Date().getMilliseconds()}`);
  // Registering instrumentations
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-xml-http-request': {
          enabled: true,
          ignoreUrls: ['/localhost:8081/sockjs-node'],
          clearTimingResources: true,
          propagateTraceHeaderCorsUrls: [/.+/g],
        },
        '@opentelemetry/instrumentation-document-load': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-user-interaction': {
          enabled: true,
          eventNames: [
            'click',
            'load',
            'loadeddata',
            'loadedmetadata',
            'loadstart',
            'error',
          ],
        },
      }),
    ],
  });
};

export { startOtelInstrumentation };
