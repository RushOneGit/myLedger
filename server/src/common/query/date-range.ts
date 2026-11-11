import { BadRequestException } from '@nestjs/common';
import { And, type FindOperator, LessThan, MoreThanOrEqual } from 'typeorm';

export function dateRange(
  from: string | undefined,
  to: string | undefined,
): FindOperator<Date> | undefined {
  if (from && to && new Date(from) >= new Date(to)) {
    throw new BadRequestException('"from" must be earlier than "to"');
  }
  if (from && to) return And(MoreThanOrEqual(new Date(from)), LessThan(new Date(to)));
  if (from) return MoreThanOrEqual(new Date(from));
  if (to) return LessThan(new Date(to));
  return undefined;
}
