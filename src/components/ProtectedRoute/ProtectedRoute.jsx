import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  const location = useLocation();

  if (!token) {
    /* The address being asked for travels with the redirect, the same way
       `AdminRoute` has always sent it, so signing in returns the reader to the
       ad they clicked rather than to the home page. */
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}