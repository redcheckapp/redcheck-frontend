import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

const App = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path ="/dashboard" element={"<div>Dashboard comming soon...</div>"} />
				<Route path ="/" element={<LoginPage />} />
			</Routes>
		</BrowserRouter>
	)
};

export default App;