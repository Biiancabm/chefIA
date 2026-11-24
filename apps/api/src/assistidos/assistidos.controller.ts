import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Vinculo } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentVinculo } from '../common/decorators/current-vinculo.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { AssistidosService } from './assistidos.service';
import { CreateAssistidoDto, UpdateAssistidoDto } from './dto/assistido.dto';

// As regras de quem vê e quem edita ficam no service, por papel
@Controller('empresas/:empresaId/assistidos')
@UseGuards(JwtAuthGuard, EmpresaRoleGuard)
export class AssistidosController {
  constructor(private readonly assistidosService: AssistidosService) {}

  @Get()
  findAll(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Query('vinculoClienteId') vinculoClienteId?: string,
  ) {
    return this.assistidosService.findAll(empresaId, vinculo, vinculoClienteId);
  }

  @Get(':id')
  findOne(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.assistidosService.findOne(empresaId, id, vinculo);
  }

  @Post()
  create(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: CreateAssistidoDto,
  ) {
    return this.assistidosService.create(empresaId, vinculo, dto);
  }

  @Patch(':id')
  update(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: UpdateAssistidoDto,
  ) {
    return this.assistidosService.update(empresaId, id, vinculo, dto);
  }

  @Delete(':id')
  remove(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.assistidosService.remove(empresaId, id, vinculo);
  }
}
