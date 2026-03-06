import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="page">
      <h1>Register</h1>
      <Link to="/login">Ir a login</Link>
    </div>
  );
}

export default Register;