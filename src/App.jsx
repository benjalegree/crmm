import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./layout/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Companies from "./pages/Companies"
import CompanyProfile from "./pages/CompanyProfile"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Overview */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* Companies List */}
        <Route
          path="/companies"
          element={
            <Layout>
              <Companies />
            </Layout>
          }
        />

        {/* Company Profile */}
        <Route
          path="/companies/:id"
          element={
            <Layout>
              <CompanyProfile />
            </Layout>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}
