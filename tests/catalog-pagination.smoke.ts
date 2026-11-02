import assert from 'node:assert/strict';
import { fetchExplorarCatalogDataRpc } from '@/lib/data/catalog-performance';

const relations = [
  ...Array.from({ length: 1000 }, (_, index) => ({
    carrera_id: 'carrera-1',
    materia_id: `materia-${index}`,
  })),
  { carrera_id: 'carrera-2', materia_id: 'materia-extra' },
];
const ranges: Array<[number, number]> = [];

const client = {
  from(table: string) {
    if (table === 'carrera_materias') {
      return {
        select() {
          return this;
        },
        order() {
          return this;
        },
        async range(from: number, to: number) {
          ranges.push([from, to]);
          return { data: relations.slice(from, to + 1), error: null };
        },
      };
    }
    const data =
      table === 'universidades'
        ? [{ id: 'uni-1', nombre: 'Universidad' }]
        : [
            { id: 'carrera-1', nombre: 'Primera', universidad_id: 'uni-1' },
            { id: 'carrera-2', nombre: 'Segunda', universidad_id: 'uni-1' },
          ];
    return {
      select() {
        return this;
      },
      async order() {
        return { data, error: null };
      },
    };
  },
  async rpc() {
    return { data: [], error: null };
  },
};

const catalog = await fetchExplorarCatalogDataRpc(client as never);
assert.deepEqual(ranges, [
  [0, 999],
  [1000, 1999],
]);
assert.equal(catalog.carreras.find((career) => career.id === 'carrera-2')?.materiasCount, 1);
assert.equal(catalog.universidades[0].materiasCount, 1001);
console.log('catalog-pagination.smoke: OK');
