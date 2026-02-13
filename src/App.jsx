import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./layout/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Companies from "./pages/Companies"
import CompanyProfile from "./pages/CompanyProfile"
import Leads from "./pages/Leads"
import LeadProfile from "./pages/LeadProfile"
import Pipeline from "./pages/Pipeline"
import Calendar from "./pages/Calendar"
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/companies" element={
          <ProtectedRoute>
            <Layout><Companies /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/companies/:id" element={
          <ProtectedRoute>
            <Layout><CompanyProfile /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/leads" element={
          <ProtectedRoute>
            <Layout><Leads /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/leads/:id" element={
          <ProtectedRoute>
            <Layout><LeadProfile /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/pipeline" element={
          <ProtectedRoute>
            <Layout><Pipeline /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout><Calendar /></Layout>
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}
