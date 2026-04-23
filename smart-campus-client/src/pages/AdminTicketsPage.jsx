import Sidebar from '../components/Sidebar';
import TicketsPage from './TicketsPage';

export default function AdminTicketsPage() {
  return (
    <div className="adm-layout">
      <Sidebar />
      <main className="adm-content">
        <TicketsPage />
      </main>
    </div>
  );
}
