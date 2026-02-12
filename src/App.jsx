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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* Companies */}
        <Route
          path="/companies"
          element={
            <Layout>
              <Companies />
            </Layout>
          }
        />

        <Route
          path="/companies/:id"
          element={
            <Layout>
              <CompanyProfile />
            </Layout>
          }
        />

        {/* Leads */}
        <Route
          path="/leads"
          element={
            <Layout>
              <Leads />
            </Layout>
          }
        />

        <Route
          path="/leads/:id"
          element={
            <Layout>
              <LeadProfile />
            </Layout>
          }
        />

        {/* Pipeline */}
        <Route
          path="/pipeline"
          element={
            <Layout>
              <Pipeline />
            </Layout>
          }
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={
            <Layout>
              <Calendar />
            </Layout>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}
