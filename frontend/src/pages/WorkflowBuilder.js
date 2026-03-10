import { useMemo, useState } from "react";

const NODE_TYPES = [
  { type: "Trigger", color: "#f5e6af" },
  { type: "Archivo", color: "#d8e7ff" },
  { type: "API", color: "#d8ddff" },
  { type: "Email", color: "#ebdefc" },
  { type: "Base de Datos", color: "#c9f1df" },
  { type: "Acción", color: "#e8edf4" }
];

const INITIAL_NODES = [];

function WorkflowBuilder() {
  const [nodes, setNodes] = useState(INITIAL_NODES);

  const edges = useMemo(() => {
    if (nodes.length < 2) {
      return [];
    }
    return nodes.slice(1).map((node, index) => ({ from: nodes[index], to: node, id: `${index}-${node.id}` }));
  }, [nodes]);

  const addNode = (nodeType) => {
    const id = `${nodeType.type}-${Date.now()}`;
    const positionIndex = nodes.length;
    setNodes((prev) => [
      ...prev,
      {
        id,
        label: nodeType.type,
        color: nodeType.color,
        x: 120 + (positionIndex % 3) * 280,
        y: 80 + Math.floor(positionIndex / 3) * 150
      }
    ]);
  };

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div className="builder-title">
          <span>←</span>
          <div>
            <h1>Nuevo Workflow</h1>
            <p className="subtitle">
              {nodes.length} nodos, {edges.length} conexiones
            </p>
          </div>
        </div>
        <div className="builder-actions">
          <button className="btn-outline">⚙&nbsp; Configuración</button>
          <button className="btn-outline">⎙&nbsp; Guardar</button>
          <button className="btn-success">▷&nbsp; Ejecutar</button>
        </div>
      </div>

      <div className="builder-main">
        <aside className="builder-sidebar">
          <h3>Nodos Disponibles</h3>
          {NODE_TYPES.map((node) => (
            <button
              key={node.type}
              className="node-type"
              style={{ background: node.color }}
              onClick={() => addNode(node)}
            >
              {node.type}
            </button>
          ))}

          <div className="instructions">
            <h4>Instrucciones</h4>
            <p>• Haz clic en un nodo para agregarlo</p>
            <p>• Conecta nodos para crear flujos</p>
            <p>• Guarda antes de ejecutar</p>
          </div>
        </aside>

        <section className="builder-canvas">
          <svg className="edge-layer" preserveAspectRatio="none">
            {edges.map((edge) => (
              <line
                key={edge.id}
                x1={edge.from.x + 110}
                y1={edge.from.y + 35}
                x2={edge.to.x + 10}
                y2={edge.to.y + 35}
                stroke="#8592a6"
                strokeWidth="2"
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className="canvas-node"
              style={{ left: `${node.x}px`, top: `${node.y}px`, background: node.color }}
            >
              {node.label}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default WorkflowBuilder;