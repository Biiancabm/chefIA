import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

const SALT_ROUNDS = 10;
const VALIDADE_REDEFINICAO_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ConflictException('Já existe uma conta com esse email');
    }

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        telefone: dto.telefone,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(dto.senha, user.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    return this.buildAuthResponse(user);
  }

  async updatePerfil(userId: string, dto: UpdatePerfilDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nome: dto.nome, telefone: dto.telefone },
    });
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
    };
  }

  async alterarSenha(userId: string, dto: AlterarSenhaDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const senhaValida = await bcrypt.compare(dto.senhaAtual, user.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { senhaHash },
    });
  }

  async esqueciSenha(dto: EsqueciSenhaDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      await this.prisma.redefinicaoSenha.deleteMany({
        where: { userId: user.id, usadoEm: null },
      });

      const token = randomBytes(32).toString('base64url');
      const tokenHash = this.hashToken(token);

      await this.prisma.redefinicaoSenha.create({
        data: {
          userId: user.id,
          tokenHash,
          expiraEm: new Date(Date.now() + VALIDADE_REDEFINICAO_MS),
        },
      });

      await this.mailService.enviarRedefinicaoSenha({
        para: user.email,
        nome: user.nome,
        token,
      });
    }

    return {
      message:
        'Se esse email estiver cadastrado, enviamos um link para redefinir a senha.',
    };
  }

  async redefinirSenha(dto: RedefinirSenhaDto) {
    const tokenHash = this.hashToken(dto.token);
    const redefinicao = await this.prisma.redefinicaoSenha.findUnique({
      where: { tokenHash },
    });

    if (
      !redefinicao ||
      redefinicao.usadoEm ||
      redefinicao.expiraEm < new Date()
    ) {
      throw new BadRequestException(
        'Esse link de redefinição é inválido ou expirou',
      );
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: redefinicao.userId },
        data: { senhaHash },
      }),
      this.prisma.redefinicaoSenha.update({
        where: { id: redefinicao.id },
        data: { usadoEm: new Date() },
      }),
    ]);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildAuthResponse(user: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
  }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
      },
    };
  }
}
