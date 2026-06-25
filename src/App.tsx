import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { CreateTask } from './pages/CreateTask';
import { TaskDetails } from './pages/TaskDetails';
import { AIPlan } from './pages/AIPlan';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateTask />} />
          <Route path="task/:id" element={<TaskDetails />} />
          <Route path="ai-plan" element={<AIPlan />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
