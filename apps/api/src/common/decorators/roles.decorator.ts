import { SetMetadata } from '@nestjs/common';
import { PapelVinculo } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PapelVinculo[]) => SetMetadata(ROLES_KEY, roles);
