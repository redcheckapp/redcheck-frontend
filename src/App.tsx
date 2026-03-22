import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const App = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage  />} />
				<Route path ="/dashboard" element={"<div>Dashboard comming soon...</div>"} />
				<Route path ="/" element={<LoginPage />} />
			</Routes>
		</BrowserRouter>
	)
};

export default App;