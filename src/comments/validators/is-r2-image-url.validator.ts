import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsR2ImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isR2ImageUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          const base = process.env.R2_PUBLIC_BASE_URL;
          if (!base) {
            return false;
          }

          try {
            const url = new URL(value);
            const baseUrl = new URL(base);
            return url.protocol === 'https:' && url.host === baseUrl.host;
          } catch {
            return false;
          }
        },
        defaultMessage(): string {
          return 'imageUrl must be an https URL hosted under the configured storage domain';
        },
      },
    });
  };
}
