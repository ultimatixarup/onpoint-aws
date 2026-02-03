// src/app/core/validators/address-validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validAddressType(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const ALLOWED_ADDRESS_TYPES = ['START', 'END', 'DELIVERY'];
    if (ALLOWED_ADDRESS_TYPES.includes(value)) {
      return null; // Valid
    }
    return { invalidType: true }; // Invalid type
  };
}
