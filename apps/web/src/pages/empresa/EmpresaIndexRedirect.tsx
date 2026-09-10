import { Navigate, useOutletContext } from 'react-router-dom';
import type { EmpresaOutletContext } from './EmpresaLayout';

export function EmpresaIndexRedirect() {
  const { papel } = useOutletContext<EmpresaOutletContext>();
  return <Navigate to={papel === 'ADMIN' ? 'dashboard' : 'ordens-servico'} replace />;
}
