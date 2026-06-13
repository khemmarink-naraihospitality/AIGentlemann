import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { InputForm } from './components/InputForm'
import { HistoryGrid } from './components/HistoryGrid'
import { SettingsPage } from './components/SettingsPage'
import { Toast } from './components/Toast'

function AppContent() {
  const { activeTab } = useApp()

  return (
    <div className="min-h-svh bg-slate-950">
      <Header />
      <TabBar />

      <main className="max-w-lg mx-auto px-4 pt-[7rem] pb-12">
        {activeTab === 'create' ? <InputForm />
          : activeTab === 'settings' ? <SettingsPage />
          : <HistoryGrid />}
      </main>

      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
