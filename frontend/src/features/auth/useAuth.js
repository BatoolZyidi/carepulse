// Thin re-export so feature code can `import { useAuth } from "../features/auth/useAuth"`
// without reaching into `context/` directly — keeps the context implementation swappable.
export { useAuth } from "../../context/AuthContext";
