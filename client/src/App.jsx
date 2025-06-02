import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import GuestLogin from "./pages/GuestLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import GoalDetails from "./pages/GoalDetails";
import theme from "./theme";
import "./styles/GlobalStyles.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/guest-login" element={<GuestLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Page Route - no authentication required */}
          <Route path="/" element={<Home />} />
          
          {/* Profile Page Route */}
          <Route path="/profile" element={<Profile />} />
          
          {/* Search Page Routes */}
          <Route path="/search" element={<Search />} />
          
          {/* Goal Details Page Route */}
          <Route path="/goals/:id" element={<GoalDetails />} />

          {/* Default redirect to home page */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
