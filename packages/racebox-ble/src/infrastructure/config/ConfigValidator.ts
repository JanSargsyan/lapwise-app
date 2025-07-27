export interface ValidationRule {
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ConfigValidator {
  validate(config: any, rules: Record<string, ValidationRule>): ValidationResult {
    const errors: string[] = [];

    for (const [key, rule] of Object.entries(rules)) {
      const value = config[key];

      if (rule.required && value === undefined) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${key} must be of type ${rule.type}`);
        }

        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${key} must be at least ${rule.min}`);
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${key} must be at most ${rule.max}`);
        }

        if (rule.pattern && !rule.pattern.test(String(value))) {
          errors.push(`${key} does not match required pattern`);
        }

        if (rule.custom && !rule.custom(value)) {
          errors.push(`${key} failed custom validation`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 