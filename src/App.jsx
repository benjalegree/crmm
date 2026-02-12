import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./layout/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Companies from "./pages/Companies"
import CompanyProfile from "./pages/CompanyProfile"
import Leads from "./pages/Leads"
import LeadProfile from "./pages/LeadProfile"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />

        <Route path="/companies" element={<Layout><Companies /></Layout>} />
        <Route path="/companies/:id" element={<Layout><CompanyProfile /></Layout>} />

        <Route path="/leads" element={<Layout><Leads /></Layout>} />
        <Route path="/leads/:id" element={<Layout><LeadProfile /></Layout>} />

      </Routes>
    </BrowserRouter>
  )
}
