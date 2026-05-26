import { useCallback, useEffect, useState } from 'react'

import {
  bookings as bookingsApi,
  clearToken,
  guests as guestsApi,
  rooms as roomsApi,
  type Booking,
  type Guest,
  type Room,
} from '../api'

interface Props {
  onLogout: () => void
}

export function Dashboard({ onLogout }: Props) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  const [newRoom, setNewRoom] = useState({ number: '', type: 'standard', capacity: 2, dailyRate: 100 })
  const [newGuest, setNewGuest] = useState({ fullName: '', email: '' })
  const [newBooking, setNewBooking] = useState({ roomId: 0, guestId: 0, checkIn: '', checkOut: '' })

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [r, g, b] = await Promise.all([roomsApi.list(), guestsApi.list(), bookingsApi.list()])
      setRooms(r)
      setGuests(g)
      setBookings(b)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function handle<T>(promise: Promise<T>) {
    promise.then(() => refresh()).catch((err) => setError(err instanceof Error ? err.message : 'unknown error'))
  }

  return (
    <main className="dashboard">
      <header>
        <h1>Hotel Booking</h1>
        <button
          onClick={() => {
            clearToken()
            onLogout()
          }}
        >
          Logout
        </button>
      </header>

      {error && <p className="error">⚠ {error}</p>}

      <section>
        <h2>Rooms</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handle(roomsApi.create(newRoom))
            setNewRoom({ number: '', type: 'standard', capacity: 2, dailyRate: 100 })
          }}
          className="row"
        >
          <input placeholder="Number" value={newRoom.number} onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })} required />
          <input placeholder="Type" value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })} />
          <input type="number" min={1} placeholder="Capacity" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })} />
          <input type="number" min={0} step="0.01" placeholder="Rate" value={newRoom.dailyRate} onChange={(e) => setNewRoom({ ...newRoom, dailyRate: Number(e.target.value) })} />
          <button type="submit">Add room</button>
        </form>
        <ul>
          {rooms.map((r) => (
            <li key={r.id}>
              <strong>#{r.number}</strong> — {r.type} · cap {r.capacity} · {r.dailyRate.toFixed(2)} €/night
              <button className="link danger" onClick={() => handle(roomsApi.delete(r.id))}>delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Guests</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handle(guestsApi.create({ fullName: newGuest.fullName, email: newGuest.email || null, phone: null }))
            setNewGuest({ fullName: '', email: '' })
          }}
          className="row"
        >
          <input placeholder="Full name" value={newGuest.fullName} onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })} required />
          <input placeholder="Email (optional)" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
          <button type="submit">Add guest</button>
        </form>
        <ul>
          {guests.map((g) => (
            <li key={g.id}><strong>{g.fullName}</strong> {g.email && <span>· {g.email}</span>}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Bookings</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handle(bookingsApi.create(newBooking))
            setNewBooking({ roomId: 0, guestId: 0, checkIn: '', checkOut: '' })
          }}
          className="row"
        >
          <select value={newBooking.roomId} onChange={(e) => setNewBooking({ ...newBooking, roomId: Number(e.target.value) })} required>
            <option value="">Room…</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>#{r.number} {r.type}</option>)}
          </select>
          <select value={newBooking.guestId} onChange={(e) => setNewBooking({ ...newBooking, guestId: Number(e.target.value) })} required>
            <option value="">Guest…</option>
            {guests.map((g) => <option key={g.id} value={g.id}>{g.fullName}</option>)}
          </select>
          <input type="date" value={newBooking.checkIn} onChange={(e) => setNewBooking({ ...newBooking, checkIn: e.target.value })} required />
          <input type="date" value={newBooking.checkOut} onChange={(e) => setNewBooking({ ...newBooking, checkOut: e.target.value })} required />
          <button type="submit">Add booking</button>
        </form>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>
              Room {b.roomId} · Guest {b.guestId} · {b.checkIn} → {b.checkOut} · {b.status}
              <button className="link danger" onClick={() => handle(bookingsApi.delete(b.id))}>delete</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
