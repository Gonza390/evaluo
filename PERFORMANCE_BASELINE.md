# Performance Baseline

## Route bundle baseline

Source: `.next/diagnostics/route-bundle-stats.json`

| Route | First-load JS |
| --- | ---: |
| `/administrador` | 1383.8 KB |
| `/simulador` | 993.5 KB |
| `/simulador/[materia_id]/[parcial]` | 993.5 KB |
| `/explorar/materia/[id]` | 960.1 KB |
| `/dashboard` | 953.6 KB |
| `/explorar` | 910.8 KB |
| `/login` | 834.5 KB |
| `/` | 580.0 KB |

## Largest local assets

Source: `public/`

| Asset | Size |
| --- | ---: |
| `hero-home-estudiante.png` | 2352.3 KB |
| `dashboard-hero-estudio.png` | 2294.7 KB |
| `simulador-resultado.png` | 2272.2 KB |
| `simulador-resultado-motivacional.png` | 2269.8 KB |
| `como-funciona-3.png` | 2250.5 KB |

The critical runtime routes already point at `.webp` variants for the largest hero illustrations. Keep new LCP imagery in `.webp` or `.avif` and reserve `priority` for a single above-the-fold image per route.

## Runtime measurements

### DevTools

1. Open Chrome DevTools `Performance`.
2. Record a fresh load for `/dashboard`, `/explorar`, `/explorar/materia/[id]`.
3. Compare `LCP`, scripting time, and long tasks before/after.
4. In `Memory`, use `Allocation instrumentation on timeline` while navigating and saving during `next dev` and `next dev --webpack`.

### Bundle stats

```powershell
(Get-Content .next\diagnostics\route-bundle-stats.json | ConvertFrom-Json) |
  Sort-Object firstLoadUncompressedJsBytes -Descending |
  Select-Object route, @{N='KB';E={[math]::Round($_.firstLoadUncompressedJsBytes / 1KB, 1)}}
```

### Asset audit

```powershell
Get-ChildItem public -Recurse -File |
  Sort-Object Length -Descending |
  Select-Object -First 15 FullName, @{N='KB';E={[math]::Round($_.Length / 1KB, 1)}}
```

### PostgreSQL / Supabase SQL

```sql
create extension if not exists pg_stat_statements;

select
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  rows,
  query
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

```sql
explain (analyze, buffers)
select id, title, created_at
from public.resumenes
where materia_id = 'TU_MATERIA_ID'
  and module_id = 1
order by created_at desc
limit 12;
```

```sql
explain (analyze, buffers)
select id, nombre, tipo, creado_at
from public.recursos
where materia_id = 'TU_MATERIA_ID'
  and tipo = 'resumen-modulo'
order by creado_at desc;
```

```sql
explain (analyze, buffers)
select id
from public.preguntas_banco
where materia_id = 'TU_MATERIA_ID'
  and parcial = 1;
```

```sql
explain (analyze, buffers)
select pregunta_id, es_correcta
from public.historial_respuestas
where usuario_id = 'TU_USUARIO_ID'
  and materia_id = 'TU_MATERIA_ID'
  and pregunta_id is not null
limit 5000;
```

## Dev server comparison

Use different ports to compare startup time and memory:

```powershell
& .\node_modules\.bin\next.cmd dev --port 3100
& .\node_modules\.bin\next.cmd dev --webpack --port 3101
```

Monitor memory with:

```powershell
Get-Process node, chrome, msedge -ErrorAction SilentlyContinue |
  Sort-Object PM -Descending |
  Select-Object Name, Id, @{N='RAM_MB';E={[math]::Round($_.PM / 1MB, 1)}}, CPU
```
