import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updatePerfil(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdatePerfilDto) {
    return this.authService.updatePerfil(user.id, dto);
  }

  @Patch('senha')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  alterarSenha(@CurrentUser() user: CurrentUserPayload, @Body() dto: AlterarSenhaDto) {
    return this.authService.alterarSenha(user.id, dto);
  }

  @Post('esqueci-senha')
  @HttpCode(200)
  esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.authService.esqueciSenha(dto);
  }

  @Post('redefinir-senha')
  @HttpCode(204)
  redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto);
  }
}
