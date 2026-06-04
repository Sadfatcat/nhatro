export type FieldType =
  | 'text' | 'email' | 'password' | 'number' | 'tel'
  | 'textarea' | 'select' | 'multiselect' | 'radio'
  | 'checkbox' | 'date' | 'datetime' | 'file' | 'hidden';

export interface FieldValidation {
  required?:       boolean;
  minLength?:      number;
  maxLength?:      number;
  min?:            number;
  max?:            number;
  pattern?:        string;
  email?:          boolean;
  custom?:         string;
  asyncValidator?: string;
  messages?: Partial<Record<
    'required' | 'minLength' | 'maxLength' | 'min' | 'max' |
    'pattern' | 'email' | 'custom' | 'beError',
    string
  >>;
}

export interface FieldOption {
  label: string;
  value: unknown;
}

export interface DependsOn {
  field: string;
  value: unknown;
}

export interface FormFieldSchema {
  key:           string;
  type:          FieldType;
  label:         string;
  placeholder?:  string;
  defaultValue?: unknown;
  validation?:   FieldValidation;
  options?:      FieldOption[];
  disabled?:     boolean;
  hidden?:       boolean;
  span?:         number;   // nz-col span (1-24), default 24
  dependsOn?:    DependsOn;
  hint?:         string;
  beErrorKey?:   string;
  addonBefore?:  string;
}

export interface FormSchema {
  fields:       FormFieldSchema[];
  submitLabel?: string;
  cancelLabel?: string;
  layout?:      'vertical' | 'horizontal';
  cols?:        number;   // grid columns, default 1
}
