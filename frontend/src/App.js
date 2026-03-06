import { useState, useRef, useCallback, useEffect } from "react";
import logoRPA from "./assets/images/LOGO RPA.png";
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
  Terminal,
  Plus,
  Settings,
  Save,
  CheckCircle,
  ArrowLeft,
  FileText,
  Globe,
  Mail,
  Database,
  Maximize,
  Lock,
  LockOpen,
  Minus,
  Menu,
  MoreHorizontal,
  Layers,
  Edit2,
  Trash2
} from "lucide-react";

const TOKENS = {
  sidebar: "#0f172a",
  mainBg: "#f1f5f9",
  white: "#ffffff",
  purple: "#6366f1",
  greenBtn: "#22c55e",
  emerald: "#10b981",
  border: "#e5e7eb",
  shadow: "0 1px 4px rgba(0,0,0,0.07)",
  cardR: 14
};

const weekData = [
  { day: "Lun", executions: 12, performance: 12 },
  { day: "Mar", executions: 18, performance: 18 },
  { day: "Mié", executions: 15, performance: 15 },
  { day: "Jue", executions: 26, performance: 26 },
  { day: "Vie", executions: 22, performance: 22 },
  { day: "Sáb", executions: 8, performance: 8 },
  { day: "Dom", executions: 5, performance: 5 }
];

const baseCardStyle = {
  background: "#fff",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9"
};

const NODE_TYPES = {
  Trigger: {
    label: "Trigger",
    icon: Zap,
    bg: "#fef9c3",
    border: "#fde68a",
    text: "#92400e",
    iconColor: "#ca8a04"
  },
  Archivo: {
    label: "Archivo",
    icon: FileText,
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1e40af",
    iconColor: "#3b82f6"
  },
  API: {
    label: "API",
    icon: Globe,
    bg: "#f0f9ff",
    border: "#bae6fd",
    text: "#0c4a6e",
    iconColor: "#0284c7"
  },
  Email: {
    label: "Email",
    icon: Mail,
    bg: "#fdf4ff",
    border: "#e9d5ff",
    text: "#6b21a8",
    iconColor: "#9333ea"
  },
  "Base de Datos": {
    label: "Base de Datos",
    icon: Database,
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#14532d",
    iconColor: "#16a34a"
  },
  "Acción": {
    label: "Acción",
    icon: Settings,
    bg: "#f8fafc",
    border: "#e2e8f0",
    text: "#1e293b",
    iconColor: "#475569"
  }
};

const NODE_W = 160;
const NODE_H = 70;
const WORKFLOWS_STORAGE_KEY = "flowrpa.savedWorkflows";

const hydrateNode = (node) => {
  const typeConfig = NODE_TYPES[node?.type] || {};

  return {
    ...node,
    label: node?.label || typeConfig.label || node?.type || "Nodo",
    icon: typeConfig.icon,
    bg: node?.bg || typeConfig.bg || "#f8fafc",
    border: node?.border || typeConfig.border || "#e2e8f0",
    text: node?.text || typeConfig.text || "#1e293b",
    iconColor: node?.iconColor || typeConfig.iconColor || "#475569"
  };
};

const hydrateWorkflow = (workflow) => {
  const hydratedNodes = Array.isArray(workflow?.nodes) ? workflow.nodes.map(hydrateNode) : [];
  const hydratedConnections = Array.isArray(workflow?.connections) ? workflow.connections : [];

  return {
    ...workflow,
    status: workflow?.status || "Activo",
    nodes: hydratedNodes,
    connections: hydratedConnections,
    nodeCount: typeof workflow?.nodeCount === "number" ? workflow.nodeCount : hydratedNodes.length,
    connectionCount: typeof workflow?.connectionCount === "number" ? workflow.connectionCount : hydratedConnections.length
  };
};

const serializeWorkflow = (workflow) => ({
  ...workflow,
  nodes: Array.isArray(workflow?.nodes)
    ? workflow.nodes.map(({ icon, ...serializableNode }) => serializableNode)
    : [],
  connections: Array.isArray(workflow?.connections) ? workflow.connections : []
});

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const formatExecTime = (date) => {
  if (!date) return "";
  const datePart = date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "2-digit"
  });
  const timePart = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  return { datePart, timePart };
};

const formatLogTime = (date) => {
  if (!date) return "00:00:00";
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      style={{
        background: "#1e293b",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 13
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#10b981" }}>executions : {payload[0].value}</div>
    </div>
  );
};

const HoverBadge = ({ children, baseStyle, shadowColor }) => {
  const [hovered, setHovered] = useState(false);
  const { shadowColor: _, ...cleanStyle } = { shadowColor, ...baseStyle };

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cleanStyle,
        transition: "box-shadow 0.2s ease, filter 0.2s ease",
        boxShadow: hovered ? `0 3px 12px 2px ${shadowColor}` : "none",
        filter: hovered ? "brightness(0.93)" : "brightness(1)",
        cursor: "default"
      }}
    >
      {children}
    </span>
  );
};

const Modal = ({ onClose, isMobile, execution }) => (
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
        background: "white",
        borderRadius: 16,
        padding: isMobile ? "24px 20px" : 36,
        width: isMobile ? "95vw" : 620,
        maxWidth: "95vw",
        maxHeight: isMobile ? "90vh" : "unset",
        overflowY: isMobile ? "auto" : "visible",
        position: "relative"
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer"
        }}
      >
        <X size={16} />
      </button>

      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{execution?.name || "Workflow"}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 24, height: 24, color: "#6ee7b7" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <span
          style={{
            background: execution?.status === "Ejecutando" ? "#fef9c3" : "#d1fae5",
            color: execution?.status === "Ejecutando" ? "#b45309" : "#059669",
            borderRadius: 8,
            padding: "6px 18px",
            fontWeight: 600,
            fontSize: 15
          }}
        >
          {execution?.status || "Completado"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>Inicio</div>
          {(() => {
            const timeData = formatExecTime(execution?.startTime);
            return (
              <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>
                <div>{timeData?.datePart}</div>
                <div>{timeData?.timePart}</div>
              </div>
            );
          })()}
        </div>

        <div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>Fin</div>
          {execution?.endTime ? (
            (() => {
              const timeData = formatExecTime(execution?.endTime);
              return (
                <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>
                  <div>{timeData?.datePart}</div>
                  <div>{timeData?.timePart}</div>
                </div>
              );
            })()
          ) : (
            <div style={{ fontWeight: 700, fontSize: 20 }}>En curso...</div>
          )}
        </div>

        <div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>Duración</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{formatDuration(execution?.durationSeconds || 0)}</div>
        </div>
      </div>

      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Resultados</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 28
        }}
      >
        {[
          ["Records Processed", execution?.records ?? 0],
          ["Files Generated", execution?.files ?? 0],
          ["Api Calls Made", execution?.apiCalls ?? 0]
        ].map(([label, value]) => (
          <div key={label} style={{ background: "#f0f9ff", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Terminal size={18} />
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>Logs de Ejecución</h3>
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
        <div>[{formatLogTime(execution?.startTime)}] Workflow execution started</div>
        <div>[{formatLogTime(execution?.startTime)}] Processing {execution?.nodeCount ?? 1} nodes</div>
        {execution?.status === "Completado" ? (
          <div>[{formatLogTime(execution?.endTime || execution?.startTime)}] Workflow completed successfully</div>
        ) : (
          <div>
            [{formatLogTime(execution?.startTime)}] Executing...
            <span style={{ animation: "pulse 1s infinite" }}> |</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Sidebar = ({ page, setPage, isMobile, sidebarOpen, setSidebarOpen }) => {
  const activeStyle = {
    background: "#6366f1",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    fontWeight: 600,
    display: "flex",
    gap: 10,
    alignItems: "center",
    cursor: "pointer"
  };

  const inactiveStyle = {
    ...activeStyle,
    background: "transparent",
    color: "#94a3b8"
  };

  const handleNavigate = (nextPage) => {
    setPage(nextPage);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        background: "#0f172a",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        ...(isMobile
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 200,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.25s ease"
            }
          : null)
      }}
    >
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            border: "none",
            background: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <X size={20} />
        </button>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
          paddingLeft: 4,
          paddingRight: isMobile ? 30 : 0
        }}
      >
        <img
          src={logoRPA}
          alt="FlowRPA Logo"
          style={{
            height: 72,
            width: 72,
            objectFit: "contain",
            borderRadius: 12
          }}
        />
        <span
          style={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.3px",
            fontFamily: "Inter, sans-serif"
          }}
        >
          FlowRPA
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={page === "dashboard" ? activeStyle : inactiveStyle} onClick={() => handleNavigate("dashboard")}>
          <LayoutDashboard size={18} /> Dashboard
        </div>
        <div
          style={page === "workflows" || page === "builder" ? activeStyle : inactiveStyle}
          onClick={() => handleNavigate("workflows")}
        >
          <GitBranch size={18} /> Workflows
        </div>
        <div
          style={{
            background: "#22c55e",
            borderRadius: 10,
            padding: "12px 14px",
            color: "white",
            fontWeight: 700,
            display: "flex",
            gap: 10,
            alignItems: "center",
            cursor: "pointer",
            marginTop: 4
          }}
          onClick={() => handleNavigate("builder")}
        >
          <Play size={16} fill="white" /> Crear Workflow
        </div>
      </div>

      <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: 14 }}>
        <div style={{ color: "#64748b", fontSize: 12 }}>Usuario</div>
        <div style={{ color: "white", fontSize: 15, fontWeight: 700 }}>Blyx Nova Demo</div>
        <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>demo@blyxnovastudio.com</div>
        <div
          style={{ color: "#64748b", fontSize: 13, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
          onClick={() => {
            window.location.href = "https://blyxnovastudio.com";
          }}
        >
          <LogOut size={15} /> Cerrar Sesión
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ isMobile, executions, setExecutions, savedWorkflows, onOpenExecution }) => {
  const [chartKey, setChartKey] = useState(0);

  const completedCount = executions.filter((e) => e.status === "Completado").length;
  const recentCount = executions.filter((e) => {
    const started = e.startTime;
    if (!started) {
      return false;
    }
    const now = new Date();
    return (
      started.getFullYear() === now.getFullYear() &&
      started.getMonth() === now.getMonth() &&
      started.getDate() === now.getDate()
    );
  }).length;

  useEffect(() => {
    setChartKey((k) => k + 1);
  }, []);

  return (
    <div
      style={{
        background: "#f8fafc",
        padding: isMobile ? "72px 16px 24px" : "36px 40px",
        overflowY: "auto",
        width: "100%",
        minWidth: 0
      }}
    >
      <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: "#64748b", marginBottom: 28 }}>Monitorea el rendimiento de tus automatizaciones</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? 12 : 18,
          marginBottom: 24
        }}
      >
        <div style={{ ...baseCardStyle, padding: "20px 20px 22px 20px", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minHeight: "unset" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#ede9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Bot color="#7c3aed" size={22} />
            </div>
            <HoverBadge baseStyle={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }} shadowColor="rgba(22, 163, 74, 0.35)">
              Activo
            </HoverBadge>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 400, marginBottom: 6 }}>Workflows Activos</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 500, color: "#0f172a", lineHeight: 1.1, marginBottom: 4 }}>{savedWorkflows.length}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 400 }}>de {savedWorkflows.length} totales</div>
        </div>

        <div style={{ ...baseCardStyle, padding: "20px 20px 22px 20px", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minHeight: "unset" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Zap color="#16a34a" size={22} />
            </div>
            <HoverBadge baseStyle={{ background: "#dcfce7", color: "#16a34a", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700 }} shadowColor="rgba(22, 163, 74, 0.35)">
              +{recentCount}
            </HoverBadge>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 400, marginBottom: 6 }}>Ejecuciones Totales</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 500, color: "#0f172a", lineHeight: 1.1, marginBottom: 4 }}>{executions.length}</div>
          <div style={{ color: "#16a34a", fontSize: 12, fontWeight: 600 }}>{completedCount} exitosas</div>
        </div>

        <div style={{ ...baseCardStyle, padding: "20px 20px 22px 20px", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minHeight: "unset" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#fef9c3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Clock color="#ca8a04" size={22} />
            </div>
            <HoverBadge baseStyle={{ background: "#fef9c3", color: "#b45309", border: "1px solid #fde68a", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }} shadowColor="rgba(180, 83, 9, 0.30)">
              Esta semana
            </HoverBadge>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 400, marginBottom: 6 }}>Tiempo Ahorrado</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 500, color: "#0f172a", lineHeight: 1.1, marginBottom: 4 }}>2.7h</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 400 }}>Horas de trabajo manual</div>
        </div>

        <div style={{ ...baseCardStyle, padding: "20px 20px 22px 20px", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minHeight: "unset", background: "linear-gradient(135deg,#ede9fe,#f5f3ff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <TrendingUp color="white" size={22} />
            </div>
            <HoverBadge baseStyle={{ background: "#6366f1", color: "white", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }} shadowColor="rgba(99, 102, 241, 0.40)">
              ROI
            </HoverBadge>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 400, marginBottom: 6 }}>Reducción de Costos</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 500, color: "#6366f1", lineHeight: 1.1, marginBottom: 4 }}>60%</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 400 }}>vs. procesos manuales</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)",
          gap: isMobile ? 14 : 18,
          marginBottom: 24
        }}
      >
        <div style={{ ...baseCardStyle, padding: isMobile ? 16 : baseCardStyle.padding }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Ejecuciones por Día</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 210}>
            <BarChart data={weekData} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 28]}
                ticks={[0, 7, 14, 21, 28]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="executions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...baseCardStyle, padding: isMobile ? 16 : baseCardStyle.padding }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Tendencia de Rendimiento</div>
          <ResponsiveContainer key={chartKey} width="100%" height={isMobile ? 180 : 210}>
            <LineChart data={weekData} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 28]}
                ticks={[0, 7, 14, 21, 28]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                dataKey="performance"
                stroke="#10b981"
                strokeWidth={2.5}
                type="monotone"
                dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={baseCardStyle}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Ejecuciones Recientes</div>
        {executions.slice(0, 10).map((exec) => (
          <div
            key={exec.id}
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: exec.status === "Completado" ? "#f0fdf4" : "#fef9c3",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {exec.status === "Completado" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} width={18} height={18}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: "2px solid #fde68a",
                      borderTop: "2px solid #ca8a04",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{exec.name}</div>
                {(() => {
                  const timeData = formatExecTime(exec.startTime);
                  return <div style={{ color: "#94a3b8", fontSize: 13 }}>{timeData ? `${timeData.datePart}, ${timeData.timePart}` : ""}</div>;
                })()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ color: "#64748b", fontSize: 14 }}>{formatDuration(exec.durationSeconds)}</div>
              <div
                style={{
                  background: exec.status === "Completado" ? "#d1fae5" : "#fef9c3",
                  color: exec.status === "Completado" ? "#059669" : "#b45309",
                  borderRadius: 8,
                  padding: "4px 14px",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {exec.status === "Ejecutando" && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      marginRight: 6,
                      animation: "pulse 1s infinite"
                    }}
                  />
                )}
                {exec.status}
              </div>
              <button
                style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
                onClick={() => onOpenExecution(exec)}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkflowsPage = ({ setPage, savedWorkflows, setSavedWorkflows, onEditWorkflow, isMobile, setExecutions, executions, onExecuteWorkflow }) => {
  const [hoveredDeleteId, setHoveredDeleteId] = useState(null);

  return (
    <div
      style={{
        background: "#f8fafc",
        padding: isMobile ? "72px 16px 24px" : "36px 40px",
        width: "100%",
        minWidth: 0,
        overflowY: "auto",
        height: "100%"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 0
        }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, marginBottom: 4 }}>Workflows</h1>
          <p style={{ color: "#64748b" }}>Gestiona tus automatizaciones</p>
        </div>
        <button
          onClick={() => setPage("builder")}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "center" : "flex-start"
          }}
        >
          <Plus size={18} /> Nuevo Workflow
        </button>
      </div>

      {savedWorkflows.length === 0 ? (
        <div style={{ ...baseCardStyle, textAlign: "center", padding: "80px 40px" }}>
          <Bot size={64} color="#cbd5e1" style={{ marginBottom: 20 }} />
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No tienes workflows todavía</div>
          <div style={{ color: "#64748b", fontSize: 15, marginBottom: 24 }}>Crea tu primer workflow automatizado</div>
          <button
            onClick={() => setPage("builder")}
            style={{ background: "#6366f1", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: "0 auto" }}
          >
            <Plus size={18} /> Crear Workflow
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 24
          }}
        >
          {savedWorkflows.map((wf) => (
            <div
              key={wf.id}
              style={{
                background: "white",
                borderRadius: 14,
                padding: "20px 20px 16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "#ede9fe",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Bot size={18} color="#7c3aed" />
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

              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{wf.name}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{wf.description || "Sin descripción"}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                {wf.nodeCount} nodos • {wf.connectionCount} conexiones
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => onEditWorkflow(wf)}
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer",
                    display: "flex",
                    gap: 6,
                    alignItems: "center"
                  }}
                >
                  <Edit2 size={14} /> Editar
                </button>

                <button
                  onClick={() => onExecuteWorkflow(wf.name, wf.nodeCount)}
                  style={{
                    background: "#10b981",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    gap: 6,
                    alignItems: "center"
                  }}
                >
                  <Play size={14} fill="white" /> Ejecutar
                </button>

                <button
                  onClick={() => setSavedWorkflows((prev) => prev.filter((w) => w.id !== wf.id))}
                  onMouseEnter={() => setHoveredDeleteId(wf.id)}
                  onMouseLeave={() => setHoveredDeleteId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Trash2 size={16} color={hoveredDeleteId === wf.id ? "#dc2626" : "#ef4444"} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BuilderPage = ({
  setPage,
  nodes,
  connections,
  dragging,
  setDragging,
  setNodes,
  setConnections,
  drawingConnection,
  setDrawingConnection,
  canvasRef,
  addNodeByType,
  zoom,
  setZoom,
  locked,
  setLocked,
  isFullscreen,
  setIsFullscreen,
  setSavedWorkflows,
  editingWorkflow,
  isMobile,
  setExecutions,
  executions,
  onExecuteWorkflow
}) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("Updated Test Workflow");
  const [workflowDesc, setWorkflowDesc] = useState("");
  const [toast, setToast] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mobileNodesOpen, setMobileNodesOpen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const workflowNameInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });

  const getPointerFromEvent = useCallback((event) => {
    if (event.touches && event.touches.length > 0) {
      return event.touches[0];
    }
    if (event.changedTouches && event.changedTouches.length > 0) {
      return event.changedTouches[0];
    }
    return event;
  }, []);

  const updateCanvasInteraction = useCallback(
    (event) => {
      if (event.touches && event.touches.length > 0) {
        event.preventDefault();
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) {
        return;
      }

      const pointer = getPointerFromEvent(event);

      if (dragging) {
        const nextX = Math.max(0, Math.min(pointer.clientX - canvasRect.left - pan.x - dragging.offsetX * zoom, canvasRect.width - NODE_W * zoom));
        const nextY = Math.max(0, Math.min(pointer.clientY - canvasRect.top - pan.y - dragging.offsetY * zoom, canvasRect.height - NODE_H * zoom));

        const unscaledX = nextX / zoom;
        const unscaledY = nextY / zoom;

        setNodes((prev) => prev.map((node) => (node.id === dragging.nodeId ? { ...node, x: unscaledX, y: unscaledY } : node)));
      }

      if (drawingConnection) {
        setDrawingConnection((prev) =>
          prev
            ? {
                ...prev,
                currentX: pointer.clientX,
                currentY: pointer.clientY
              }
            : prev
        );
      }
    },
    [canvasRef, dragging, drawingConnection, getPointerFromEvent, pan.x, pan.y, setDrawingConnection, setNodes, zoom]
  );

  const clearInteractions = useCallback(
    (event) => {
      if (event && event.touches && event.touches.length > 0) {
        event.preventDefault();
      }

      if (dragging) {
        setDragging(null);
      }
      if (drawingConnection) {
        setDrawingConnection(null);
      }
    },
    [dragging, drawingConnection, setDragging, setDrawingConnection]
  );

  const beginNodeDrag = useCallback(
    (event, nodeId) => {
      if (locked) {
        return;
      }

      if (event.touches && event.touches.length > 0) {
        event.preventDefault();
      }
      event.stopPropagation();

      const pointer = getPointerFromEvent(event);
      const rect = event.currentTarget.getBoundingClientRect();

      setDragging({
        nodeId,
        offsetX: (pointer.clientX - rect.left) / zoom,
        offsetY: (pointer.clientY - rect.top) / zoom
      });
    },
    [getPointerFromEvent, locked, setDragging, zoom]
  );

  const beginConnection = useCallback(
    (event, nodeId, anchor) => {
      if (locked) {
        return;
      }

      if (event.touches && event.touches.length > 0) {
        event.preventDefault();
      }
      event.stopPropagation();

      const rect = canvasRef.current?.getBoundingClientRect();
      const node = nodes.find((item) => item.id === nodeId);
      if (!rect || !node) {
        return;
      }

      const dotX = node.x + NODE_W / 2;
      const dotY = anchor === "bottom" ? node.y + NODE_H : node.y;

      const absX = rect.left + pan.x + dotX * zoom;
      const absY = rect.top + pan.y + dotY * zoom;

      setDrawingConnection({
        fromNodeId: nodeId,
        fromX: absX,
        fromY: absY,
        currentX: absX,
        currentY: absY
      });
    },
    [canvasRef, locked, nodes, pan.x, pan.y, setDrawingConnection, zoom]
  );

  const completeConnection = useCallback(
    (event, targetNodeId) => {
      if (!drawingConnection) {
        return;
      }

      if (event.touches && event.touches.length > 0) {
        event.preventDefault();
      }
      event.stopPropagation();

      if (targetNodeId !== drawingConnection.fromNodeId) {
        setConnections((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            fromNodeId: drawingConnection.fromNodeId,
            toNodeId: targetNodeId
          }
        ]);
      }

      setDrawingConnection(null);
    },
    [drawingConnection, setConnections, setDrawingConnection]
  );

  const handleZoomIn = useCallback(() => {
    setZoom((value) => Math.min(2.0, parseFloat((value + 0.1).toFixed(1))));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((value) => Math.max(0.4, parseFloat((value - 0.1).toFixed(1))));
  }, [setZoom]);

  const toggleFullscreen = useCallback(async () => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        return;
      } catch {
        setIsFullscreen((value) => !value);
        return;
      }
    }

    if (canvasElement.requestFullscreen) {
      try {
        await canvasElement.requestFullscreen();
        return;
      } catch {
        setIsFullscreen((value) => !value);
        return;
      }
    }

    setIsFullscreen((value) => !value);
  }, [canvasRef, setIsFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [setIsFullscreen]);

  useEffect(() => {
    if (configOpen) {
      workflowNameInputRef.current?.focus();
      workflowNameInputRef.current?.select();
    }
  }, [configOpen]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    if (!isMobile) {
      setShowMoreMenu(false);
      setMobileNodesOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (editingWorkflow) {
      setWorkflowName(editingWorkflow.name);
      setWorkflowDesc(editingWorkflow.description);
      setNodes(editingWorkflow.nodes || []);
      setConnections(editingWorkflow.connections || []);
      setPan({ x: 0, y: 0 });
      setIsPanning(false);
      return;
    }

    setWorkflowName("Updated Test Workflow");
    setWorkflowDesc("");
    setNodes([]);
    setConnections([]);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  }, [editingWorkflow, setConnections, setNodes]);

  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-flowrpa-toast", "true");
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveClick = useCallback(() => {
    const wf = {
      id: editingWorkflow ? editingWorkflow.id : Date.now(),
      name: workflowName || "Updated Test Workflow",
      description: workflowDesc || "",
      nodeCount: nodes.length,
      connectionCount: connections.length,
      status: "Activo",
      nodes: [...nodes],
      connections: [...connections]
    };

    if (editingWorkflow) {
      setSavedWorkflows((prev) => prev.map((w) => (w.id === wf.id ? wf : w)));
    } else {
      setSavedWorkflows((prev) => [...prev, wf]);
    }

    setToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(false), 3000);
  }, [connections, editingWorkflow, nodes, setSavedWorkflows, workflowDesc, workflowName]);

  const canvasBounds = canvasRef.current?.getBoundingClientRect();

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          height: isMobile ? 56 : 60,
          padding: isMobile ? "0 12px" : "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "relative"
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setPage("workflows")} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700 }}>{workflowName}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              <span style={{ fontSize: isMobile ? 11 : 13 }}>
                {nodes.length} nodos, {connections.length} conexiones
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
          {!isMobile && (
            <>
              <button
                onClick={() => setConfigOpen(true)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", fontWeight: 500, fontSize: 14, background: "white", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
              >
                <Settings size={16} /> Configuración
              </button>
              <button
                onClick={handleSaveClick}
                style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", fontWeight: 500, fontSize: 14, background: "white", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
              >
                <Save size={16} /> Guardar
              </button>
            </>
          )}
          {isMobile && (
            <button
              onClick={() => setShowMoreMenu((value) => !value)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                width: 36,
                height: 36,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <MoreHorizontal size={18} color="#374151" />
            </button>
          )}
          <button
            onClick={() => onExecuteWorkflow(workflowName, nodes.length)}
            style={{ border: "none", borderRadius: 10, padding: isMobile ? "8px 14px" : "8px 20px", fontWeight: 600, fontSize: 14, background: "#10b981", color: "white", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
          >
            <Play size={16} fill="white" /> {!isMobile && "Ejecutar"}
            {isMobile && "Ejecutar"}
          </button>
          {isMobile && showMoreMenu && (
            <div
              style={{
                position: "absolute",
                top: 56,
                right: 12,
                background: "white",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                border: "1px solid #e5e7eb",
                zIndex: 50,
                overflow: "hidden"
              }}
            >
              <div
                onClick={() => {
                  setConfigOpen(true);
                  setShowMoreMenu(false);
                }}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  cursor: "pointer",
                  color: "#374151",
                  borderBottom: "1px solid #f1f5f9"
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "white";
                }}
              >
                <Settings size={16} /> Configuración
              </div>
              <div
                onClick={() => {
                  handleSaveClick();
                  setShowMoreMenu(false);
                }}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  cursor: "pointer",
                  color: "#374151"
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "white";
                }}
              >
                <Save size={16} /> Guardar
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0, position: "relative" }}>
        {!isMobile && (
          <div style={{ width: 200, flexShrink: 0, background: "white", borderRight: "1px solid #e5e7eb", padding: "16px 12px", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Nodos Disponibles</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.values(NODE_TYPES).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.label}
                    onClick={() => addNodeByType(type.label)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      background: type.bg,
                      color: type.text
                    }}
                  >
                    <Icon size={20} color={type.iconColor} /> {type.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Instrucciones</div>
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.9 }}>
                <div>• Haz clic en un nodo para agregarlo</div>
                <div>• Arrastra desde un punto de conexión</div>
                <div>• Conecta nodos para crear flujos</div>
                <div>• Guarda antes de ejecutar</div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={canvasRef}
          onMouseDown={(event) => {
            if (locked) {
              return;
            }
            if (event.target === event.currentTarget || event.target.dataset.canvas === "true") {
              setIsPanning(true);
              setPanStart({ x: event.clientX - panRef.current.x, y: event.clientY - panRef.current.y });
              event.preventDefault();
            }
          }}
          onMouseMove={(event) => {
            if (isPanning) {
              setPan({
                x: event.clientX - panStart.x,
                y: event.clientY - panStart.y
              });
              return;
            }
            updateCanvasInteraction(event);
          }}
          onTouchStart={(event) => {
            if (locked) {
              return;
            }
            if (event.touches.length === 1) {
              const touch = event.touches[0];
              setIsPanning(true);
              setPanStart({ x: touch.clientX - panRef.current.x, y: touch.clientY - panRef.current.y });
            }
          }}
          onTouchMove={(event) => {
            if (isPanning && event.touches.length === 1) {
              event.preventDefault();
              const touch = event.touches[0];
              setPan({
                x: touch.clientX - panStart.x,
                y: touch.clientY - panStart.y
              });
              return;
            }
            updateCanvasInteraction(event);
          }}
          onMouseUp={(event) => {
            setIsPanning(false);
            clearInteractions(event);
          }}
          onTouchEnd={(event) => {
            setIsPanning(false);
            clearInteractions(event);
          }}
          onMouseLeave={(event) => {
            setIsPanning(false);
            clearInteractions(event);
          }}
          style={{
            flex: 1,
            height: isMobile ? "calc(100vh - 56px)" : "100%",
            position: "relative",
            overflow: "hidden",
            cursor: isPanning ? "grabbing" : locked ? "default" : "grab",
            background: "#f1f5f9",
            backgroundImage: "radial-gradient(circle, #c8d3e0 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            touchAction: "none",
            ...(isFullscreen
              ? {
                  position: "fixed",
                  inset: 0,
                  zIndex: 100,
                  background: "#f1f5f9"
                }
              : null)
          }}
        >
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 5,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              transition: isPanning ? "none" : "transform 0.15s ease"
            }}
          >
            {connections.map((connection) => {
              const source = nodes.find((node) => node.id === connection.fromNodeId);
              const target = nodes.find((node) => node.id === connection.toNodeId);
              if (!source || !target) {
                return null;
              }

              const x1 = source.x + NODE_W / 2;
              const y1 = source.y + NODE_H;
              const x2 = target.x + NODE_W / 2;
              const y2 = target.y;

              return (
                <path
                  key={connection.id}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + 60}, ${x2} ${y2 - 60}, ${x2} ${y2}`}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

            {drawingConnection && canvasBounds ? (
              <line
                x1={(drawingConnection.fromX - canvasBounds.left - pan.x) / zoom}
                y1={(drawingConnection.fromY - canvasBounds.top - pan.y) / zoom}
                x2={(drawingConnection.currentX - canvasBounds.left - pan.x) / zoom}
                y2={(drawingConnection.currentY - canvasBounds.top - pan.y) / zoom}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="6 3"
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          <div
            data-canvas="true"
            style={{
              position: "absolute",
              inset: 0,
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              transition: isPanning ? "none" : "transform 0.15s ease"
            }}
          >
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  onMouseDown={(event) => beginNodeDrag(event, node.id)}
                  onTouchStart={(event) => beginNodeDrag(event, node.id)}
                  onMouseUp={(event) => completeConnection(event, node.id)}
                  onTouchEnd={(event) => completeConnection(event, node.id)}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: NODE_W,
                    minHeight: NODE_H,
                    background: node.bg,
                    border: `2px solid ${node.border}`,
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: locked ? "not-allowed" : "grab",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    userSelect: "none",
                    color: node.text
                  }}
                >
                  <div
                    onMouseDown={(event) => beginConnection(event, node.id, "top")}
                    onTouchStart={(event) => beginConnection(event, node.id, "top")}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#1e293b",
                      position: "absolute",
                      cursor: "crosshair",
                      zIndex: 10,
                      border: "2px solid white",
                      top: -5,
                      left: "50%",
                      transform: "translateX(-50%)"
                    }}
                  />
                  <div
                    onMouseDown={(event) => beginConnection(event, node.id, "bottom")}
                    onTouchStart={(event) => beginConnection(event, node.id, "bottom")}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#1e293b",
                      position: "absolute",
                      cursor: "crosshair",
                      zIndex: 10,
                      border: "2px solid white",
                      bottom: -5,
                      left: "50%",
                      transform: "translateX(-50%)"
                    }}
                  />
                  <Icon size={24} color={node.iconColor} />
                  <div>{node.label}</div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: isMobile ? 80 : 20,
              left: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            <button
              onClick={handleZoomIn}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                borderBottom: "1px solid #f1f5f9"
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
              }}
            >
              <Plus size={17} />
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                borderBottom: "1px solid #f1f5f9"
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
              }}
            >
              <Minus size={17} />
            </button>
            <button
              onClick={toggleFullscreen}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                borderBottom: "1px solid #f1f5f9"
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
              }}
            >
              <Maximize size={17} />
            </button>
            <button
              onClick={() => setLocked((value) => !value)}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: locked ? "1px solid #fde68a" : "1px solid #f1f5f9",
                borderTop: "none",
                background: locked ? "#fef3c7" : "white"
              }}
            >
              {locked ? <Lock size={17} /> : <LockOpen size={17} />}
            </button>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              width: 150,
              height: 90,
              background: "white",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}
          />
        </div>

        {isMobile && (
          <button
            onClick={() => setMobileNodesOpen((value) => !value)}
            style={{
              position: "fixed",
              bottom: 16,
              left: 16,
              zIndex: 160,
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer"
            }}
          >
            <Layers size={16} /> Nodos
          </button>
        )}

        {isMobile && mobileNodesOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 150,
              background: "white",
              borderRadius: "16px 16px 0 0",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
              maxHeight: "55vh",
              overflowY: "auto",
              padding: "16px 16px 24px"
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#e2e8f0",
                borderRadius: 2,
                margin: "0 auto 14px"
              }}
            />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Nodos Disponibles</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {Object.values(NODE_TYPES).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.label}
                    onClick={() => addNodeByType(type.label)}
                    style={{
                      width: "100%",
                      padding: "11px 10px",
                      borderRadius: 10,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      background: type.bg,
                      color: type.text
                    }}
                  >
                    <Icon size={18} color={type.iconColor} /> {type.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Instrucciones</div>
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.9 }}>
                <div>• Haz clic en un nodo para agregarlo</div>
                <div>• Arrastra desde un punto de conexión</div>
                <div>• Conecta nodos para crear flujos</div>
                <div>• Guarda antes de ejecutar</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            animation: "toastIn 0.25s ease forwards"
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "11px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              fontSize: 14,
              fontWeight: 500,
              color: "#0f172a",
              minWidth: 200
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CheckCircle size={14} color="white" />
            </div>
            <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 500 }}>Workflow creado</span>
          </div>
        </div>
      )}

      {configOpen && (
        <div
          onClick={() => setConfigOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 12,
              padding: isMobile ? "24px 20px" : "28px 28px 24px",
              width: isMobile ? "95vw" : 420,
              maxWidth: "92vw",
              maxHeight: isMobile ? "90vh" : "unset",
              overflowY: isMobile ? "auto" : "visible",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              fontFamily: "Inter, sans-serif"
            }}
          >
            <button
              onClick={() => setConfigOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={18} />
            </button>

            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Configuración del Workflow</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Configura el nombre y descripción de tu automatización
            </div>

            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6, display: "block" }}>
              Nombre del Workflow
            </label>
            <input
              ref={workflowNameInputRef}
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1.5px solid #6366f1",
                borderRadius: 8,
                fontSize: 14,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6, display: "block" }}>
              Descripción (opcional)
            </label>
            <textarea
              value={workflowDesc}
              onChange={(event) => setWorkflowDesc(event.target.value)}
              placeholder="Describe qué hace este workflow..."
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                color: "#6b7280",
                resize: "vertical",
                minHeight: 80,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfigOpen(false)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151",
                  cursor: "pointer"
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "white";
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executions, setExecutions] = useState([
    {
      id: 1,
      name: "Updated Test Workflow",
      startTime: new Date("2026-04-03T13:05:44"),
      endTime: new Date("2026-04-03T13:05:55"),
      durationSeconds: 11,
      status: "Completado",
      records: 138,
      files: 2,
      apiCalls: 12,
      nodeCount: 1
    }
  ]);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [savedWorkflows, setSavedWorkflows] = useState(() => {
    try {
      const raw = window.localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(hydrateWorkflow) : [];
    } catch {
      return [];
    }
  });
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [drawingConnection, setDrawingConnection] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-flowrpa-reset", "true");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { width: 100%; height: 100%; }
      body { overflow: hidden; overflow-x: hidden; font-family: Inter, sans-serif; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    try {
      const serializable = savedWorkflows.map(serializeWorkflow);
      window.localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(serializable));
    } catch {
    }
  }, [savedWorkflows]);

  useEffect(() => {
    if (!selectedExecution) {
      return;
    }

    const updated = executions.find((exec) => exec.id === selectedExecution.id);
    if (updated) {
      setSelectedExecution(updated);
    }
  }, [executions, selectedExecution]);

  const handleExecute = useCallback((workflowName, nodeCount = 1) => {
    const startTime = new Date();
    const executionId = Date.now();

    const runningExec = {
      id: executionId,
      name: workflowName,
      startTime,
      endTime: null,
      durationSeconds: 0,
      status: "Ejecutando",
      records: 0,
      files: 0,
      apiCalls: 0,
      nodeCount: Math.max(1, nodeCount || 1)
    };

    setExecutions((prev) => [runningExec, ...prev]);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed++;
      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? {
                ...exec,
                durationSeconds: elapsed
              }
            : exec
        )
      );
    }, 1000);

    const totalDuration = Math.floor(Math.random() * 8) + 8;
    setTimeout(() => {
      clearInterval(interval);
      const endTime = new Date();
      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? {
                ...exec,
                endTime,
                durationSeconds: totalDuration,
                status: "Completado",
                records: Math.floor(Math.random() * 200) + 50,
                files: Math.floor(Math.random() * 5) + 1,
                apiCalls: Math.floor(Math.random() * 20) + 5
              }
            : exec
        )
      );
    }, totalDuration * 1000);
  }, []);

  const addNodeByType = useCallback(
    (typeName) => {
      const typeConfig = NODE_TYPES[typeName];
      const rect = canvasRef.current?.getBoundingClientRect();

      const canvasWidth = rect?.width ?? 1200;
      const canvasHeight = rect?.height ?? 700;

      const nextNode = {
        id: `${typeName}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        type: typeName,
        x: Math.max(0, Math.floor(Math.random() * Math.max(1, canvasWidth - 450)) + 250),
        y: Math.max(0, Math.floor(Math.random() * Math.max(1, canvasHeight - 260)) + 80),
        label: typeConfig.label,
        icon: typeConfig.icon,
        bg: typeConfig.bg,
        border: typeConfig.border,
        text: typeConfig.text,
        iconColor: typeConfig.iconColor
      };

      setNodes((prev) => [...prev, nextNode]);
    },
    [canvasRef]
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        overflowX: "hidden",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box"
      }}
    >
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 300,
            background: "#6366f1",
            borderRadius: 10,
            width: 40,
            height: 40,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <Menu size={20} color="white" />
        </button>
      )}

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 199
          }}
        />
      )}

      <Sidebar
        page={page}
        setPage={setPage}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        {page === "dashboard" && (
          <DashboardPage
            isMobile={isMobile}
            executions={executions}
            setExecutions={setExecutions}
            savedWorkflows={savedWorkflows}
            onOpenExecution={(execution) => {
              setSelectedExecution(execution);
              setModalOpen(true);
            }}
          />
        )}
        {page === "workflows" && (
          <WorkflowsPage
            setPage={setPage}
            savedWorkflows={savedWorkflows}
            setSavedWorkflows={setSavedWorkflows}
            isMobile={isMobile}
            executions={executions}
            setExecutions={setExecutions}
            onExecuteWorkflow={handleExecute}
            onEditWorkflow={(wf) => {
              setEditingWorkflow(wf);
              setPage("builder");
            }}
          />
        )}
        {page === "builder" && (
          <BuilderPage
            setPage={setPage}
            savedWorkflows={savedWorkflows}
            setSavedWorkflows={setSavedWorkflows}
            editingWorkflow={editingWorkflow}
            nodes={nodes}
            connections={connections}
            dragging={dragging}
            setDragging={setDragging}
            setNodes={setNodes}
            setConnections={setConnections}
            drawingConnection={drawingConnection}
            setDrawingConnection={setDrawingConnection}
            canvasRef={canvasRef}
            addNodeByType={addNodeByType}
            zoom={zoom}
            setZoom={setZoom}
            locked={locked}
            setLocked={setLocked}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
            executions={executions}
            setExecutions={setExecutions}
            onExecuteWorkflow={handleExecute}
          />
        )}
      </div>
      {modalOpen && selectedExecution && <Modal onClose={() => setModalOpen(false)} isMobile={isMobile} execution={selectedExecution} />}
    </div>
  );
}
