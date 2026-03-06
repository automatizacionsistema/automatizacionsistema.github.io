import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard,
  GitBranch,
  Play,
  Bot,
  Zap,
  Clock,
  TrendingUp,
  Eye,
  LogOut,
  X,
  Terminal
} from "lucide-react";

const weekData = [
  { day: "Lun", ejecuciones: 12, rendimiento: 13 },
  { day: "Mar", ejecuciones: 18, rendimiento: 19 },
  { day: "Mié", ejecuciones: 15, rendimiento: 15 },
  { day: "Jue", ejecuciones: 26, rendimiento: 26 },
  { day: "Vie", ejecuciones: 22, rendimiento: 22 },
  { day: "Sáb", ejecuciones: 8, rendimiento: 8 },
  { day: "Dom", ejecuciones: 5, rendimiento: 5 }
];

const Modal = ({ onClose }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 36,
        width: 620,
        maxWidth: "95vw",
        position: "relative",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          width: 32,
          height: 32,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <X size={16} />
      </button>

      <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>Updated Test Workflow</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 24, height: 24, color: "#6ee7b7" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <span
          style={{
            background: "#d1fae5",
            color: "#059669",
            fontWeight: 600,
            padding: "6px 18px",
            borderRadius: 8,
            fontSize: 15
          }}
        >
          Completado
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
        {[
          { label: "Inicio", value: "13:05:44" },
          { label: "Fin", value: "13:05:44" },
          { label: "Duración", value: "11s" }
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Resultados</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Records Processed", value: "138" },
          { label: "Files Generated", value: "2" },
          { label: "Api Calls Made", value: "12" }
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "#f0f9ff",
              borderRadius: 10,
              padding: "14px 16px"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Terminal size={18} />
        <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Logs de Ejecución</h3>
      </div>
      <div
        style={{
          background: "#0f172a",
          borderRadius: 10,
          padding: 20,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#4ade80",
          lineHeight: 1.8
        }}
      >
        <div>[16:05:44] Workflow execution started</div>
        <div>[16:05:44] Processing 1 nodes</div>
        <div>[16:05:44] Executing node 1: Trigger</div>
        <div>[16:05:44] Workflow completed successfully</div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);

  const sidebarStyle = {
    width: 260,
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
    fontFamily: "Inter, sans-serif",
    flexShrink: 0
  };

  const mainStyle = {
    flex: 1,
    background: "#f8fafc",
    padding: "36px 40px",
    fontFamily: "Inter, sans-serif",
    overflowY: "auto"
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9"
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={sidebarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 }}>
          <div
            style={{
              background: "#6366f1",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Bot size={20} color="#fff" />
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>FlowRPA</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#6366f1",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#fff",
              fontWeight: 600,
              marginBottom: 4,
              cursor: "pointer"
            }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#94a3b8",
              padding: "10px 14px",
              cursor: "pointer",
              borderRadius: 10,
              marginBottom: 16
            }}
          >
            <GitBranch size={18} /> Workflows
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#22c55e",
              borderRadius: 10,
              padding: "12px 14px",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 15
            }}
          >
            <Play size={16} fill="#fff" /> Crear Workflow
          </div>
        </nav>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>Usuario</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Usuario Demo</div>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 14 }}>demo@flowrpa.com</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#64748b",
              cursor: "pointer",
              fontSize: 13
            }}
          >
            <LogOut size={15} /> Cerrar Sesión
          </div>
        </div>
      </div>

      <div style={mainStyle}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ color: "#64748b", marginBottom: 32, fontSize: 15 }}>
          Monitorea el rendimiento de tus automatizaciones
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
          <div style={cardStyle}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}
            >
              <div
                style={{
                  background: "#ede9fe",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bot size={22} color="#7c3aed" />
              </div>
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Activo
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>Workflows Activos</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>1</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>de 1 totales</div>
          </div>

          <div style={cardStyle}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}
            >
              <div
                style={{
                  background: "#dcfce7",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Zap size={22} color="#16a34a" />
              </div>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#16a34a",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                +1
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>Ejecuciones Totales</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>1</div>
            <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>1 exitosas</div>
          </div>

          <div style={cardStyle}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}
            >
              <div
                style={{
                  background: "#fef9c3",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Clock size={22} color="#ca8a04" />
              </div>
              <span
                style={{
                  background: "#fef9c3",
                  color: "#b45309",
                  border: "1px solid #fde68a",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Esta semana
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>Tiempo Ahorrado</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>2.7h</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Horas de trabajo manual</div>
          </div>

          <div style={{ ...cardStyle, background: "linear-gradient(135deg,#ede9fe 0%,#f5f3ff 100%)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}
            >
              <div
                style={{
                  background: "#6366f1",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <TrendingUp size={22} color="#fff" />
              </div>
              <span
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "2px 12px",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                ROI
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>Reducción de Costos</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#6366f1" }}>60%</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>vs. procesos manuales</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Ejecuciones por Día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 28]}
                  ticks={[0, 7, 14, 21, 28]}
                />
                <Tooltip />
                <Bar dataKey="ejecuciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Tendencia de Rendimiento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weekData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 28]}
                  ticks={[0, 7, 14, 21, 28]}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rendimiento"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Ejecuciones Recientes</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
              borderRadius: 10,
              padding: "14px 18px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  width={18}
                  height={18}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Updated Test Workflow</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>4/3/26, 13:05</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ color: "#64748b", fontSize: 14 }}>11s</span>
              <span
                style={{
                  background: "#d1fae5",
                  color: "#059669",
                  borderRadius: 8,
                  padding: "4px 14px",
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                Completado
              </span>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && <Modal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
