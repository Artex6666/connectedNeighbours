import { swaggerSpec } from '../config/swagger';

type Spec = {
  paths?: Record<string, Record<string, { tags?: string[] }>>;
  components?: { schemas?: Record<string, unknown> };
};

const spec = swaggerSpec as Spec;

describe('Spécification Swagger', () => {
  it('expose les schémas de composants attendus', () => {
    const schemas = spec.components?.schemas ?? {};
    for (const name of [
      'User',
      'Neighborhood',
      'Polygon',
      'Service',
      'Event',
      'Message',
      'Incident',
      'Alerte',
      'ApiError',
    ]) {
      expect(schemas[name]).toBeDefined();
    }
  });

  it('documente tous les groupes de routes implémentés', () => {
    const paths = spec.paths ?? {};
    // Au moins un endpoint documenté par module existant
    for (const route of [
      '/auth/login',
      '/users/me',
      '/neighborhoods',
      '/services',
      '/events',
      '/messages',
      '/messages/{userId}',
      '/incidents',
      '/alertes',
      '/stats/dashboard',
    ]) {
      expect(paths[route]).toBeDefined();
    }
  });

  it('rattache les nouvelles routes documentées à leurs tags', () => {
    const paths = spec.paths ?? {};
    expect(paths['/neighborhoods']?.get?.tags).toContain('Neighborhoods');
    expect(paths['/neighborhoods']?.post?.tags).toContain('Neighborhoods');
    expect(paths['/messages']?.get?.tags).toContain('Messages');
    expect(paths['/messages/{userId}']?.post?.tags).toContain('Messages');
  });
});
