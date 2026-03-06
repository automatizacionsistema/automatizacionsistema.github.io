import { useParams } from "react-router-dom";

function ExecutionDetails() {
  const { id } = useParams();
  return <div className="page">Execution Details: {id}</div>;
}

export default ExecutionDetails;