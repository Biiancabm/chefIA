import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConvitesService } from './convites.service';

@Controller('convites')
export class ConvitesController {
  constructor(private readonly convitesService: ConvitesService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.convitesService.preview(token);
  }

  @Post(':token/aceitar')
  @UseGuards(JwtAuthGuard)
  aceitar(
    @Param('token') token: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.convitesService.aceitar(token, user.id);
  }
}
