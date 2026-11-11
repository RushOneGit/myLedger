// common/decorators/is-positive-amount.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';

const POSITIVE_AMOUNT = /^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/;

export function IsPositiveAmount(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    MaxLength(40),
    Matches(POSITIVE_AMOUNT, {
      message: '$property must be a positive decimal string, e.g. "150.50"',
    }),
  );
}
