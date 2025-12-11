import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "./AppContext";


export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useContext(AppContext);

  return isLoggedIn ? children : <Navigate to="/login" />;
}
