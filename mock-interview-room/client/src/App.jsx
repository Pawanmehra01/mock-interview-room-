import { BrowserRouter, Routes, Route } from 'react-router-dom'
import JoinRoom from './pages/JoinRoom'
import Room from './pages/Room'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}