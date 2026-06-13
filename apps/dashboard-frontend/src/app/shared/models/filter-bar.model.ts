export interface FilterSelectOption {
  label: string;
  value: string;
}

export type FilterFieldType = 'text' | 'select' | 'datetime';

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterSelectOption[];
}

export type FilterValues = Record<string, string>;
