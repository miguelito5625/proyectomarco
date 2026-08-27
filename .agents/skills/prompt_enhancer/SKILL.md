---
name: prompt_enhancer
description: Reglas para analizar y mejorar el requerimiento (prompt) del usuario antes de iniciar la codificación, asegurando una comprensión óptima y planificación clara.
---
# Mejora y Clarificación del Requerimiento Inicial (Prompt Enhancer)

Antes de escribir cualquier línea de código o ejecutar comandos de modificación en el proyecto, DEBES analizar y mejorar el requerimiento inicial del usuario:

1. **Análisis del Requerimiento:**
   - Desglosa la solicitud del usuario en objetivos técnicos, archivos involucrados y posibles impactos colaterales en el proyecto.
   - Si el requerimiento es breve o ambiguo, "tradúcelo" a una serie de pasos técnicos y claros (un plan de implementación estructurado).

2. **Refinamiento:**
   - Define explícitamente cómo se va a abordar el problema. Asegúrate de tener en cuenta el estado actual del proyecto (dependencias, arquitectura, convenciones).
   - Si tras tu análisis detectas que falta información crítica o hay contradicciones, debes consultarlo con el usuario antes de proceder.

3. **Transición a la Ejecución:**
   - Utiliza este requerimiento mejorado y detallado como tu guía estricta para realizar los cambios.
   - Una vez finalizada la codificación, deberás continuar el flujo de trabajo obligatorio con las skills `auto_compiler` y `auto_commiter`.
