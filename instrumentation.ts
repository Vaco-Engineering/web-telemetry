import api from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
// import { ZoneContextManager } from '@opentelemetry/context-zone';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

interface InstrumentationConfig {
  name: string;
  namespace?: string;
  version?: string;
  id?: string;
  url?: string;
}

export default {
  config: (config: InstrumentationConfig) => {
    if (config.url) {
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: config.id,
          [SemanticResourceAttributes.SERVICE_NAME]: config.name,
          [SemanticResourceAttributes.SERVICE_NAMESPACE]: config.namespace,
          [SemanticResourceAttributes.SERVICE_VERSION]: config.version
        })
      );

      const provider: WebTracerProvider = new WebTracerProvider({
        resource: resource
      });

      const exporter = new OTLPTraceExporter({
        url: config.url
      });

      provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

      provider.register({
        // NOTE: This seems to cause problem with data fetcing and Jotai (maybe other things as well)
        // contextManager: new ZoneContextManager()
      });

      // Registering instrumentations
      registerInstrumentations({
        instrumentations: [getWebAutoInstrumentations()]
      });

      api.propagation.setGlobalPropagator(new B3Propagator());

      return api;
    }
  }
};
