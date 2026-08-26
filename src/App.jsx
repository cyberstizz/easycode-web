import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import Shell from './components/Shell'
import ErrorBoundary from './components/ErrorBoundary'
import Placeholder from './pages/Placeholder'
import NotFound from './pages/NotFound'
import MarketingShell from './pages/marketing/MarketingShell'
import Home from './pages/marketing/Home'
import HowItWorks from './pages/marketing/HowItWorks'
import Pricing from './pages/marketing/Pricing'
import Contact from './pages/marketing/Contact'

import Login from './pages/auth/Login'
import AcceptInvite from './pages/auth/AcceptInvite'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import Today from './pages/admin/Today'
import Pipeline from './pages/admin/Pipeline'
import LeadDetail from './pages/admin/LeadDetail'
import LogCall from './pages/admin/LogCall'
import ConvertLead from './pages/admin/ConvertLead'
import NewLead from './pages/admin/NewLead'
import RequestsInbox from './pages/admin/RequestsInbox'
import Clients from './pages/admin/Clients'
import Projects from './pages/admin/Projects'
import ClientDetail from './pages/admin/ClientDetail'
import ProjectEditor from './pages/admin/ProjectEditor'

import Overview from './pages/portal/Overview'
import NewRequest from './pages/portal/NewRequest'
import Files from './pages/portal/Files'
import Settings from './pages/portal/Settings'
import Project from './pages/portal/Project'
import Requests from './pages/portal/Requests'
import RequestDetail from './pages/portal/RequestDetail'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* public */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Placeholder title="Work" />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/invite" element={<AcceptInvite />} />
          {/* The API emails this exact path — see OrgService.invite */}
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* client portal */}
          <Route path="/portal" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="project" element={<Project />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/new" element={<NewRequest />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="files" element={<Files />} />
            <Route path="billing" element={<Placeholder title="Billing" />} />
            <Route path="invoices/:id" element={<Placeholder title="Invoice" />} />
            <Route path="invoices/:id/pay" element={<Placeholder title="Pay invoice" />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* admin console */}
          <Route path="/admin" element={<ProtectedRoute staff><Shell /></ProtectedRoute>}>
            <Route index element={<Today />} />
            <Route path="requests" element={<RequestsInbox />} />
            <Route path="requests/:id" element={<RequestsInbox />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="leads/new" element={<NewLead />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="leads/:id/log" element={<LogCall />} />
            <Route path="leads/:id/convert" element={<ConvertLead />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
            <Route path="invoices" element={<ProtectedRoute owner><Placeholder title="Invoices" /></ProtectedRoute>} />
            <Route path="agents" element={<ProtectedRoute owner><Placeholder title="Agents" /></ProtectedRoute>} />
          </Route>

          <Route path="/app" element={<Navigate to="/portal" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}