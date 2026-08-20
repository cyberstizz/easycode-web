import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import Shell from './components/Shell'
import ErrorBoundary from './components/ErrorBoundary'
import Placeholder from './pages/Placeholder'
import NotFound from './pages/NotFound'

import Login from './pages/auth/Login'
import AcceptInvite from './pages/auth/AcceptInvite'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import Overview from './pages/portal/Overview'
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
          <Route path="/" element={<Placeholder title="Marketing home" note="Batch 5 mockups port here next." />} />
          <Route path="/work" element={<Placeholder title="Work" />} />
          <Route path="/how-it-works" element={<Placeholder title="How it works" />} />
          <Route path="/pricing" element={<Placeholder title="Pricing" />} />
          <Route path="/contact" element={<Placeholder title="Contact" />} />

          {/* auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/invite" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* client portal */}
          <Route path="/portal" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="project" element={<Project />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/new" element={<Placeholder title="New request" />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="files" element={<Placeholder title="Files" />} />
            <Route path="billing" element={<Placeholder title="Billing" />} />
            <Route path="invoices/:id" element={<Placeholder title="Invoice" />} />
            <Route path="invoices/:id/pay" element={<Placeholder title="Pay invoice" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>

          {/* admin console */}
          <Route path="/admin" element={<ProtectedRoute staff><Shell /></ProtectedRoute>}>
            <Route index element={<Placeholder title="Today" />} />
            <Route path="requests" element={<Placeholder title="Requests inbox" />} />
            <Route path="requests/:id" element={<Placeholder title="Request" />} />
            <Route path="pipeline" element={<Placeholder title="Pipeline" />} />
            <Route path="leads/:id" element={<Placeholder title="Lead" />} />
            <Route path="leads/:id/convert" element={<Placeholder title="Convert lead" />} />
            <Route path="clients" element={<Placeholder title="Clients" />} />
            <Route path="clients/:id" element={<Placeholder title="Client" />} />
            <Route path="projects" element={<Placeholder title="Projects" />} />
            <Route path="projects/:id" element={<Placeholder title="Project editor" />} />
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