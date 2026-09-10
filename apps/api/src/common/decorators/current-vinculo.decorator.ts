import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Vinculo } from '@prisma/client';

export const CurrentVinculo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Vinculo => {
    const request = ctx.switchToHttp().getRequest();
    return request.vinculo;
  },
);
