const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app', 'features');

function fixTS(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixTS(fullPath);
        } else if (file.endsWith('.component.ts') && (file.includes('-list') || file.includes('costo-labor') || file.includes('horas-trabajador'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix missing imports at the top
            if (content.includes('MatInputModule') && !content.includes("import { MatInputModule }")) {
                content = "import { MatInputModule } from '@angular/material/input';\nimport { MatFormFieldModule } from '@angular/material/form-field';\nimport { MatIconModule } from '@angular/material/icon';\n" + content;
                modified = true;
            }

            // Fix missing imports in the imports array
            if (!content.includes('MatInputModule')) {
                content = "import { MatInputModule } from '@angular/material/input';\nimport { MatFormFieldModule } from '@angular/material/form-field';\nimport { MatIconModule } from '@angular/material/icon';\n" + content;
                content = content.replace(/imports: \[\s*CommonModule, MatTableModule,/, "imports: [\n    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatIconModule,");
                modified = true;
            }

            // Fix missing applyFilter method
            if (!content.includes('applyFilter')) {
                const method = `
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
`;
                // find the last closing brace
                const lastBraceIndex = content.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    content = content.substring(0, lastBraceIndex) + method + '}\n';
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', file);
            }
        }
    }
}
fixTS(srcDir);
