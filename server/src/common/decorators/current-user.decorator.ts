import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: { userId?: string } }>();
  const userId = request.user?.userId;
  if (!userId) {
    throw new UnauthorizedException();
  }
  return userId;
});
