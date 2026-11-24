import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { PapelVinculo } from '@prisma/client';

const PAPEL_LABEL: Record<PapelVinculo, string> = {
  ADMIN: 'administrador',
  EXECUTOR: 'executor',
  CLIENTE: 'cliente',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly remetente: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    this.remetente =
      this.config.get<string>('SMTP_FROM') ??
      '"easyService" <no-reply@easyservice.app>';
    this.frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');

    if (!host) {
      this.transporter = null;
      return;
    }

    const usuario = this.config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: usuario
        ? { user: usuario, pass: this.config.get<string>('SMTP_PASS') }
        : undefined,
    });
  }

  async enviarConvite(params: {
    para: string;
    empresaNome: string;
    papel: PapelVinculo;
    token: string;
    expiraEm: Date;
  }) {
    const link = `${this.frontendUrl}/convites/${params.token}`;
    const papelLabel = PAPEL_LABEL[params.papel];
    const expiraFormatado = params.expiraEm.toLocaleString('pt-BR');

    await this.enviar({
      para: params.para,
      linkParaLog: link,
      subject: `Convite para participar de ${params.empresaNome}`,
      text: `Você foi convidado para participar de ${params.empresaNome} como ${papelLabel}.\n\nAcesse o link para aceitar o convite: ${link}\n\nEsse convite expira em ${expiraFormatado}.`,
      html: `
        <p>Você foi convidado para participar de <strong>${params.empresaNome}</strong> como <strong>${papelLabel}</strong>.</p>
        <p><a href="${link}">Clique aqui para aceitar o convite</a></p>
        <p style="color:#666;font-size:13px">Esse convite expira em ${expiraFormatado}.</p>
      `,
    });
  }

  async enviarRedefinicaoSenha(params: {
    para: string;
    nome: string;
    token: string;
  }) {
    const link = `${this.frontendUrl}/redefinir-senha/${params.token}`;

    await this.enviar({
      para: params.para,
      linkParaLog: link,
      subject: 'Redefinição de senha',
      text: `Olá, ${params.nome}. Recebemos um pedido para redefinir sua senha.\n\nAcesse o link para escolher uma nova senha: ${link}\n\nEsse link expira em 1 hora. Se você não pediu isso, ignore este email.`,
      html: `
        <p>Olá, ${params.nome}. Recebemos um pedido para redefinir sua senha.</p>
        <p><a href="${link}">Clique aqui para escolher uma nova senha</a></p>
        <p style="color:#666;font-size:13px">Esse link expira em 1 hora. Se você não pediu isso, ignore este email.</p>
      `,
    });
  }

  private async enviar(params: {
    para: string;
    linkParaLog: string;
    subject: string;
    text: string;
    html: string;
  }) {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP não configurado — email para ${params.para} (${params.subject}): ${params.linkParaLog}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.remetente,
        to: params.para,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar email para ${params.para}: ${(erro as Error).message}`,
      );
    }
  }
}
