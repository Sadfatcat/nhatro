import { AbstractControl, ValidatorFn } from '@angular/forms';

export const CUSTOM_VALIDATORS: Record<string, ValidatorFn> = {
  noWhitespace: (ctrl: AbstractControl) => {
    const v = ctrl.value ?? '';
    return v && /\s/.test(v) ? { noWhitespace: true } : null;
  },

  vietnamesePhone: (ctrl: AbstractControl) => {
    const v = ctrl.value ?? '';
    if (!v) return null;
    return /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/.test(v)
      ? null
      : { vietnamesePhone: { message: 'Số điện thoại không đúng định dạng Việt Nam' } };
  },

  strongPassword: (ctrl: AbstractControl) => {
    const v = ctrl.value ?? '';
    if (!v) return null;
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(v)
      ? null
      : { strongPassword: { message: 'Mật khẩu cần ≥8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt' } };
  },

  noSpecialChars: (ctrl: AbstractControl) => {
    const v = ctrl.value ?? '';
    if (!v) return null;
    return /^[a-zA-ZÀ-ỹ0-9\s]+$/.test(v)
      ? null
      : { noSpecialChars: { message: 'Không được chứa ký tự đặc biệt' } };
  },

  positiveNumber: (ctrl: AbstractControl) => {
    const v = parseFloat(ctrl.value);
    if (isNaN(v)) return null;
    return v > 0 ? null : { positiveNumber: { message: 'Giá trị phải lớn hơn 0' } };
  },
};
