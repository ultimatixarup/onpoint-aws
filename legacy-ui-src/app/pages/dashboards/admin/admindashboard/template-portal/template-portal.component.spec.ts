import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatePortalComponent } from './template-portal.component';

describe('TemplatePortalComponent', () => {
  let component: TemplatePortalComponent;
  let fixture: ComponentFixture<TemplatePortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplatePortalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplatePortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
