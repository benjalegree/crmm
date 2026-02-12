import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./layout/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Companies from "./pages/Companies"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login público */}
        <Route path="/" element={<Login />} />

        {/* Dashboard / Overview */}
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

      </Routes>
    </BrowserRouter>
  )
}
