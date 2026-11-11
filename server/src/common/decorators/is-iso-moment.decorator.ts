import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

// The value must end with Z or ±hh:mm (ADR-0010)
const OFFSET_AT_END = /(?:Z|[+-]\d{2}:\d{2})$/;

export function IsIsoMoment(): PropertyDecorator {
  return applyDecorators(
    IsISO8601({ strict: true, strictSeparator: true }),
    Matches(OFFSET_AT_END, {
      message: '$property must be an ISO-8601 moment with an offset (Z or ±hh:mm)',
    }),
  );
}
