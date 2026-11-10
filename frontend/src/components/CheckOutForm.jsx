// src/components/CheckOutForm.jsx
import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { validateVehicleNumber } from '../utils/validators';

export default function CheckOutForm() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingSession, setPendingSession] = useState(null); // fare calculate hone ke baad
  const [doneMessage, setDoneMessage] = useState('');

  async function handleCalculateFare(e) {
    e.preventDefault();
    setError('');
    setDoneMessage('');

    const validationError = validateVehicleNumber(vehicleNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/sessions/initiate-checkout', {
        vehicleNumber: vehicleNumber.toUpperCase(),
      });
      setPendingSession(res.data.session);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(paymentMethod) {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.post('/sessions/confirm-payment', {
        vehicleNumber: vehicleNumber.toUpperCase(),
        paymentMethod,
      });
      setDoneMessage(
        `Checked out! Slot ${res.data.slot.slotNumber} freed. Paid via ${paymentMethod.toUpperCase()}.`
      );
      setPendingSession(null);
      setVehicleNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {doneMessage && <div className="success-banner">{doneMessage}</div>}
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {!pendingSession ? (
        <form onSubmit={handleCalculateFare} noValidate>
          <div className="form-group">
            <label className="form-label">Vehicle Number</label>
            <input
              type="text"
              className="form-input"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. DL1AB1234"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Fare'}
          </button>
        </form>
      ) : (
        <div>
          <div className="form-group">
            <p>Duration: <strong>{pendingSession.durationMinutes} min</strong></p>
            <p>Fare Due: <strong>₹{pendingSession.fare}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={() => handleConfirmPayment('cash')}
              disabled={loading}
            >
              Cash Paid
            </button>
            <button
              className="btn-primary"
              onClick={() => handleConfirmPayment('qr')}
              disabled={loading}
            >
              QR Paid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


























// // src/components/CheckOutForm.jsx
// import { useState } from 'react';
// import axiosClient from '../api/axiosClient';
// import { validateVehicleNumber } from '../utils/validators';

// export default function CheckOutForm() {
//   const [vehicleNumber, setVehicleNumber] = useState('');
//   const [error, setError] = useState('');
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError('');
//     setResult(null);

//     const validationError = validateVehicleNumber(vehicleNumber);
//     if (validationError) {
//       setError(validationError);
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await axiosClient.post('/sessions/check-out', {
//         vehicleNumber: vehicleNumber.toUpperCase(),
//       });
//       setResult(res.data);
//       setVehicleNumber('');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Something went wrong. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div>
//       {result && (
//         <div className="success-banner">
//           Checked out! Slot {result.session.slotNumber} freed.<br />
//           Duration: {result.session.durationMinutes} min — Fare: ₹{result.session.fare}
//         </div>
//       )}
//       {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

//       <form onSubmit={handleSubmit} noValidate>
//         <div className="form-group">
//           <label className="form-label">Vehicle Number</label>
//           <input
//             type="text"
//             className="form-input"
//             value={vehicleNumber}
//             onChange={(e) => setVehicleNumber(e.target.value)}
//             placeholder="e.g. DL1AB1234"
//           />
//         </div>

//         <button type="submit" className="btn-primary" disabled={loading}>
//           {loading ? 'Checking out...' : 'Check Out'}
//         </button>
//       </form>
//     </div>
//   );
// }