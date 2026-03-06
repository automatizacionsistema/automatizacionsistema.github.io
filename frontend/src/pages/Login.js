import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="page">
      <h1>Login</h1>
      <Link to="/dashboard">Entrar</Link>
    </div>
  );
}

export default Login;