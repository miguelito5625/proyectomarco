---
name: auto_compiler
description: Reglas para la validación autónoma de integridad y auto-corrección de errores del proyecto.
---
# Validación Autónoma de Integridad (Post-Edición)

Para CADA cambio o tarea que se te pida realizar en este proyecto, DEBES seguir estrictamente este flujo de trabajo una vez finalices la edición del código:

- Inmediatamente después de completar las modificaciones al código y *antes* de reportar al usuario que la tarea ha finalizado, estás obligado a realizar una prueba de ejecución del proyecto (ej. arrancando el servidor con `ng build` en background) para comprobar su estabilidad.
- Si durante esta prueba detectas errores, debes entrar en un ciclo de auto-corrección: analiza el error, aplica la solución y vuelve a probar iterativamente de forma autónoma.
- Solo se te permite notificar al usuario sobre la finalización de la tarea (y proceder con la siguiente etapa, como commits) una vez que hayas verificado empíricamente que la aplicación arranca y funciona sin emitir errores.
