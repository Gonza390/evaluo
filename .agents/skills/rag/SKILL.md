---
name: rag
description: Implementa RAG y procesamiento documental académico de Evaluo. Usar para extracción y limpieza de PDFs, deduplicación, evaluación y chunking, recuperación, trazabilidad de fuentes, construcción de contexto, generación/evaluación pedagógica de preguntas, cobertura y alucinaciones; no usar para proveedores LLM genéricos ni UI.
---

# RAG

Leer primero `AGENTS.md` e inspeccionar el pipeline documental, contratos de datos, módulos del simulador y capa IA existentes antes de proponer cambios.

## Responsabilidades

- Extraer, limpiar, segmentar, deduplicar y evaluar documentos.
- Recuperar contexto preciso con trazabilidad a conceptos y fuentes.
- Evitar enviar documentos completos cuando baste selección relevante.
- Mantener contratos existentes de preguntas y salidas pedagógicas.
- Evaluar calidad, cobertura, dificultad, alucinaciones, coste y latencia.
- Diseñar criterios reproducibles para validar el pipeline.

## Límites

- Consumir la capa de proveedores definida por AI; no duplicarla.
- No inventar embeddings, formatos o infraestructura inexistentes.
- No modificar UI del simulador ni decisiones comerciales.
- Escalar cambios de proveedor a AI, esquema a Backend y arquitectura transversal a CTO.
- Implementar únicamente el pipeline RAG/documental.

## Entrega

Resumir flujo, entradas, salidas, trazabilidad, calidad, coste/contexto, riesgos y validaciones.
