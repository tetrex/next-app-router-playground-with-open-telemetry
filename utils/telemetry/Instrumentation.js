import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { exporterOptions, resourceSettings } from '../config';
const serviceName = 'signoz-browser-tracing';
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});
const provider = new WebTracerProvider({
  resource: resourceSettings,
});
const webTracerWithZone = provider.getTracer(serviceName);
let bindingSpan;

window.startBindingSpan = (traceId, spanId, traceFlags) => {
  bindingSpan = webTracerWithZone.startSpan('');
  bindingSpan.spanContext().traceId = traceId;
  bindingSpan.spanContext().spanId = spanId;
  bindingSpan.spanContext().traceFlags = traceFlags;
};

export function setupTracer() {
  provider.addSpanProcessor(new BatchSpanProcessor(exporterOptions));
  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        // load custom configuration for xml-http-request instrumentation
        '@opentelemetry/instrumentation-xml-http-request': {
          propagateTraceHeaderCorsUrls: [/.+/g],
        },
        // load custom configuration for fetch instrumentation
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: [/.+/g],
        },
      }),
    ],
  });
}

export function traceSpan(name, func) {
  let singleSpan;
  if (bindingSpan) {
    const ctx = trace.setSpan(context.active(), bindingSpan);
    singleSpan = webTracerWithZone.startSpan(name, undefined, ctx);
    bindingSpan = undefined;
  } else {
    singleSpan = webTracerWithZone.startSpan(name);
  }
  return context.with(trace.setSpan(context.active(), singleSpan), () => {
    try {
      const result = func();
      singleSpan.end();
      return result;
    } catch (error) {
      singleSpan.setStatus({ code: SpanStatusCode.ERROR });
      singleSpan.end();
      throw error;
    }
  });
}
