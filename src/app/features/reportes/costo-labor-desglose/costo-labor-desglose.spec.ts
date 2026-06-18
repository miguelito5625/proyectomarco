import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostoLaborDesglose } from './costo-labor-desglose';

describe('CostoLaborDesglose', () => {
  let component: CostoLaborDesglose;
  let fixture: ComponentFixture<CostoLaborDesglose>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostoLaborDesglose],
    }).compileComponents();

    fixture = TestBed.createComponent(CostoLaborDesglose);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
