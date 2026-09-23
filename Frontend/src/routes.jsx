import {
  Home,
  NotFound,
  Login,
  Success,
  One,
  Admin,
  AdminDetail,
  Discord_Callback,
  Profile,
  Note,
  AdminManage,
  EmailSignup,
  EmailSignin,
  GithubCallback,
  About,
  Analytics,
  Focus,
  Google_Callback,
  Comming,
  AdminUsers,
  Performance,
  AuditLogs,
  Request,
} from './pages';
import { Navigate, useLocation } from "react-router-dom";

const REQUEST_TYPES = Object.freeze({
  SUPPORT: 1,
  REPORT: 2,
  APPLICATION: 3,
  ACCOUNT_DELETION: 4,
});

function RequireLogin({ children, isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

const routes = (isAuthenticated) => [
  { path: "/", element: <RequireLogin isAuthenticated={isAuthenticated}><Home /></RequireLogin> },
  { path: "/request/:requestType", element: <RequireLogin isAuthenticated={isAuthenticated}><Request /></RequireLogin> },
  { path: "/support", element: <Navigate to={`/request/${REQUEST_TYPES.SUPPORT}`} replace /> },
  { path: "/report", element: <Navigate to={`/request/${REQUEST_TYPES.REPORT}`} replace /> },
  { path: "/apply", element: <Navigate to={`/request/${REQUEST_TYPES.APPLICATION}`} replace /> },
  { path: "/login", element: <Login /> },
  { path: "/success", element: <RequireLogin isAuthenticated={isAuthenticated}><Success /></RequireLogin> },
  { path: "/one", element: <RequireLogin isAuthenticated={isAuthenticated}><One /></RequireLogin> },
  { path: "/admin", element: <RequireLogin isAuthenticated={isAuthenticated}><Admin /></RequireLogin> },
  { path: "/admindetail", element: <RequireLogin isAuthenticated={isAuthenticated}><AdminDetail /></RequireLogin> },
  { path: "*", element: <RequireLogin isAuthenticated={isAuthenticated}><NotFound /></RequireLogin> },
  { path: "/callback", element: <Discord_Callback /> },
  { path: "/google/callback", element: <Google_Callback /> },
  { path: "/profile", element: <RequireLogin isAuthenticated={isAuthenticated}><Profile /></RequireLogin> },
  { path: "/admin/manage", element: <RequireLogin isAuthenticated={isAuthenticated}><AdminManage /></RequireLogin> },
  { path: "/note", element: <Note /> },
  { path: "/email-signup", element: <Comming /> },
  { path: "email-signin", element: <Comming /> },
  { path: "/github/callback", element: isAuthenticated ? <Home /> : <GithubCallback /> },
  { path: "/about", element: <About /> },
  { path: "/analytics", element: <RequireLogin isAuthenticated={isAuthenticated}><Analytics /></RequireLogin> },
  { path: "/admin/users", element: <RequireLogin isAuthenticated={isAuthenticated}><AdminUsers /></RequireLogin> },
  { path: "/admin/audit-logs", element: <RequireLogin isAuthenticated={isAuthenticated}><AuditLogs /></RequireLogin> },
  { path: "/performance", element: <RequireLogin isAuthenticated={isAuthenticated}><Performance /></RequireLogin> },
];

export default routes;
