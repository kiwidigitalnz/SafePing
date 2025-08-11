"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var react_router_dom_1 = require("react-router-dom");
var auth_1 = require("./store/auth");
var AuthLayout_1 = require("./components/layouts/AuthLayout");
var DashboardLayout_1 = require("./components/layouts/DashboardLayout");
var SignIn_1 = require("./pages/auth/SignIn");
var SignUp_1 = require("./pages/auth/SignUp");
var VerifyCode_1 = require("./pages/auth/VerifyCode");
var Onboarding_1 = require("./pages/auth/Onboarding");
var AcceptInvitation_1 = require("./pages/auth/AcceptInvitation");
var Dashboard_1 = require("./pages/Dashboard");
var Staff_1 = require("./pages/Staff");
var CheckIns_1 = require("./pages/CheckIns");
var Schedules_1 = require("./pages/Schedules");
var Incidents_1 = require("./pages/Incidents");
var Settings_1 = require("./pages/Settings");
var queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function ProtectedRoute(_a) {
    var children = _a.children;
    var _b = (0, auth_1.useAuthStore)(), user = _b.user, loading = _b.loading;
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>);
    }
    if (!user) {
        return <react_router_dom_1.Navigate to="/auth/signin" replace/>;
    }
    return <>{children}</>;
}
function PublicRoute(_a) {
    var children = _a.children;
    var _b = (0, auth_1.useAuthStore)(), user = _b.user, loading = _b.loading;
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>);
    }
    if (user) {
        return <react_router_dom_1.Navigate to="/dashboard" replace/>;
    }
    return <>{children}</>;
}
function App() {
    var initialize = (0, auth_1.useAuthStore)(function (state) { return state.initialize; });
    (0, react_1.useEffect)(function () {
        initialize();
    }, [initialize]);
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <react_router_dom_1.BrowserRouter>
        <react_router_dom_1.Routes>
          {/* Public routes */}
          <react_router_dom_1.Route path="/auth/*" element={<PublicRoute>
                <AuthLayout_1.AuthLayout />
              </PublicRoute>}>
            <react_router_dom_1.Route path="signin" element={<SignIn_1.SignIn />}/>
            <react_router_dom_1.Route path="signup" element={<SignUp_1.SignUp />}/>
            <react_router_dom_1.Route path="verify" element={<VerifyCode_1.VerifyCode />}/>
            <react_router_dom_1.Route path="accept-invitation" element={<AcceptInvitation_1.AcceptInvitation />}/>
          </react_router_dom_1.Route>
          
          {/* Onboarding route - separate from auth layout */}
          <react_router_dom_1.Route path="/onboarding" element={<Onboarding_1.Onboarding />}/>
          
          {/* Protected routes */}
          <react_router_dom_1.Route path="/*" element={<ProtectedRoute>
                <DashboardLayout_1.DashboardLayout />
              </ProtectedRoute>}>
            <react_router_dom_1.Route path="dashboard" element={<Dashboard_1.Dashboard />}/>
            <react_router_dom_1.Route path="staff" element={<Staff_1.Staff />}/>
            <react_router_dom_1.Route path="checkins" element={<CheckIns_1.CheckIns />}/>
            <react_router_dom_1.Route path="schedules" element={<Schedules_1.Schedules />}/>
            <react_router_dom_1.Route path="incidents" element={<Incidents_1.Incidents />}/>
            <react_router_dom_1.Route path="settings" element={<Settings_1.Settings />}/>
            <react_router_dom_1.Route path="" element={<react_router_dom_1.Navigate to="/dashboard" replace/>}/>
          </react_router_dom_1.Route>
        </react_router_dom_1.Routes>
      </react_router_dom_1.BrowserRouter>
    </react_query_1.QueryClientProvider>);
}
exports.default = App;
