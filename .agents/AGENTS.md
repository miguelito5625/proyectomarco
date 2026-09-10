# Reglas de Proyecto: proyectomarco

Para CADA consulta, cambio o tarea que se te pida realizar en este proyecto, DEBES usar `graphify` (para extraer contexto) y las skills `prompt_enhancer`, `auto_compiler` y `auto_commiter` de forma obligatoria.
Lee las instrucciones de estas herramientas y asegúrate de seguirlas en este orden estricto:
1. Primero, utiliza `graphify` (la skill o reglas instaladas) para explorar el grafo de conocimiento, resolver dependencias, y obtener el contexto técnico actualizado de la base de código.
2. Luego aplica `prompt_enhancer` para analizar y mejorar el entendimiento del requerimiento basándote en el contexto obtenido, ANTES de modificar el código.
3. Tras realizar los cambios, aplica `auto_compiler` para validar que el código funciona.
4. Finalmente aplica `auto_commiter` para subir los cambios al repositorio remoto.

### Reglas de Base de Datos
- **MANDATORIO**: ANTES de realizar cualquier modificación estructural o masiva a la base de datos (Supabase/PostgreSQL), DEBES crear un backup de la base de datos actual y guardarlo en la carpeta `db/backup`. Sigue las instrucciones que se encuentren en esa carpeta para generar el respaldo.
