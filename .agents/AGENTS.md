# Reglas de Proyecto: FactuCheck (Verificador de Facturas)

## Flujo de Trabajo y Verificación de Errores
Para CADA cambio o tarea que se te pida realizar en este proyecto, DEBES seguir estrictamente este flujo de trabajo una vez finalices la edición del código:

1. **Validación Autónoma de Integridad (Post-Edición):**
   - Inmediatamente después de completar las modificaciones al código y *antes* de reportar al usuario que la tarea ha finalizado, estás obligado a realizar una prueba de ejecución del proyecto (ej. arrancando el servidor con `ng build` en background) para comprobar su estabilidad.
   - Si durante esta prueba detectas errores, debes entrar en un ciclo de auto-corrección: analiza el error, aplica la solución y vuelve a probar iterativamente de forma autónoma.
   - Solo se te permite notificar al usuario sobre la finalización de la tarea (y proceder con el push a git) una vez que hayas verificado empíricamente que la aplicación arranca y funciona sin emitir errores.

2. **Control de Versiones y Sincronización Automática (Git):**
   - Una vez que estés seguro de que el código funciona y no tiene errores, debes realizar las siguientes acciones en la terminal (Powershell) para subir los cambios al repositorio remoto:
     ```bash
     git add .
     git commit -am "Agrega aquí un breve resumen de los cambios realizados"
     git push -u origin main
     ```
   - No preguntes al usuario si desea subir los cambios, asume que es el flujo por defecto para este proyecto y ejecuta los comandos (el usuario tendrá que aprobar el comando terminal).
