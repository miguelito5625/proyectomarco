---
name: auto_commiter
description: Reglas para el control de versiones y sincronización automática (Git) del proyecto.
---
# Control de Versiones y Sincronización Automática (Git)

Una vez que estés seguro de que el código funciona y no tiene errores (después de validar los cambios con la skill auto_compiler), debes realizar las siguientes acciones en la terminal (Powershell) para subir los cambios al repositorio remoto:

```bash
git add .
git commit -am "Agrega aquí un breve resumen de los cambios realizados"
git push -u origin main
```

- No preguntes al usuario si desea subir los cambios, asume que es el flujo por defecto para este proyecto y ejecuta los comandos (el usuario tendrá que aprobar el comando terminal).
