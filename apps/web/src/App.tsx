import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConviteAceitarPage } from './pages/ConviteAceitarPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmpresaDashboardPage } from './pages/empresa/EmpresaDashboardPage';
import { EmpresaIndexRedirect } from './pages/empresa/EmpresaIndexRedirect';
import { EmpresaLayout } from './pages/empresa/EmpresaLayout';
import { AssistidosPage } from './pages/empresa/AssistidosPage';
import { EquipePage } from './pages/empresa/EquipePage';
import { FinanceiroPage } from './pages/empresa/FinanceiroPage';
import { OrdemServicoDetailPage } from './pages/empresa/OrdemServicoDetailPage';
import { OrdensServicoPage } from './pages/empresa/OrdensServicoPage';
import { ServicosPage } from './pages/empresa/ServicosPage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { LoginPage } from './pages/LoginPage';
import { RedefinirSenhaPage } from './pages/RedefinirSenhaPage';
import { RegisterPage } from './pages/RegisterPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
        <Route path="/redefinir-senha/:token" element={<RedefinirSenhaPage />} />
        <Route path="/convites/:token" element={<ConviteAceitarPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/empresas/:empresaId" element={<EmpresaLayout />}>
            <Route index element={<EmpresaIndexRedirect />} />
            <Route path="dashboard" element={<EmpresaDashboardPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="equipe" element={<EquipePage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="assistidos" element={<AssistidosPage />} />
            <Route path="ordens-servico" element={<OrdensServicoPage />} />
            <Route
              path="ordens-servico/:ordemServicoId"
              element={<OrdemServicoDetailPage />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
