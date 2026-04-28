const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app', 'features');

// 1. Fix Forms SCSS
function fixFormScss(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFormScss(fullPath);
        } else if (file.endsWith('-form.component.scss') || file.endsWith('-dialog.component.scss')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/min-width:\s*\d+px;/g, 'width: 100%;');
            if (content.includes('.row {') && !content.includes('flex-wrap: wrap;')) {
                content = content.replace(/\.row\s*\{[^}]+\}/g, match => {
                    return match.replace('gap: 16px;', 'gap: 16px;\n  flex-wrap: wrap;');
                });
            }
            if (content.includes('.half-width {') && !content.includes('min-width: 200px;')) {
                content = content.replace(/\.half-width\s*\{[^}]+\}/g, match => {
                    return match.replace('flex: 1;', 'flex: 1 1 calc(50% - 16px);\n  min-width: 200px;');
                });
            }
            fs.writeFileSync(fullPath, content);
            console.log('Fixed Form SCSS:', file);
        }
    }
}
fixFormScss(srcDir);

// 2. Add Filter to Lists
function fixLists(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixLists(fullPath);
        } else if (file.endsWith('.component.ts') && (file.includes('-list') || file.includes('costo-labor') || file.includes('horas-trabajador'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Add import if not present
            if (!content.includes('MatTableDataSource')) {
                content = content.replace("import { MatTableModule } from '@angular/material/table';", "import { MatTableModule, MatTableDataSource } from '@angular/material/table';");
            }
            
            // Add input module import if needed
            if (!content.includes('MatInputModule')) {
                if (content.includes("import { MatIconModule } from '@angular/material/icon';")) {
                    content = content.replace("import { MatIconModule } from '@angular/material/icon';", "import { MatIconModule } from '@angular/material/icon';\nimport { MatInputModule } from '@angular/material/input';\nimport { MatFormFieldModule } from '@angular/material/form-field';");
                }
                
                // Add to imports array
                content = content.replace(/imports: \[\s*CommonModule, MatTableModule,/, "imports: [\n    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule,");
            }

            // Replace data source
            if (!content.includes('dataSource = new MatTableDataSource')) {
                content = content.replace(/([a-zA-Z]+) = signal<[a-zA-Z\[\]]+>\(\[\]\);/, "dataSource = new MatTableDataSource<any>([]);\n  $1 = signal<any[]>([]); // kept for compat");
                
                // Update assignment
                content = content.replace(/this\.([a-zA-Z]+)\.set\((data|res|data \|\| \[\])\);/g, "this.$1.set($2);\n      this.dataSource.data = $2;");
                
                // Add applyFilter method
                const filterMethod = `
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
`;
                if (!content.includes('applyFilter')) {
                    content = content.replace(/}$/, filterMethod + "}\n");
                }
                fs.writeFileSync(fullPath, content);
                console.log('Fixed List TS:', file);
            }
        } else if (file.endsWith('.component.html') && (file.includes('-list') || file.includes('costo-labor') || file.includes('horas-trabajador'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (!content.includes('table-controls')) {
                const searchHtml = `
    <div class="table-controls">
      <mat-form-field appearance="outline" class="filter-input">
        <mat-label>Buscar...</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput (keyup)="applyFilter($event)" placeholder="Escribe para buscar en la tabla...">
      </mat-form-field>
    </div>
    <mat-card-content class="table-container">`;
                content = content.replace('<mat-card-content class="table-container">', searchHtml);
                
                // Replace datasource binding
                content = content.replace(/\[dataSource\]="[a-zA-Z]+\(\)"/g, '[dataSource]="dataSource"');
                
                fs.writeFileSync(fullPath, content);
                console.log('Fixed List HTML:', file);
            }
        } else if (file.endsWith('.component.scss') && (file.includes('-list') || file.includes('costo-labor') || file.includes('horas-trabajador'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (!content.includes('.table-controls')) {
                const styles = `
.table-controls {
  padding: 16px 24px 0 24px;
}
.filter-input {
  width: 300px;
}
@media (max-width: 600px) {
  .filter-input {
    width: 100%;
  }
}
`;
                content += styles;
                fs.writeFileSync(fullPath, content);
                console.log('Fixed List SCSS:', file);
            }
        }
    }
}
fixLists(srcDir);
