// src/components/CheckInForm.jsx
import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  validateName,
  validatePhone,
  validateVehicleNumber,
  validateVehicleType,
} from '../utils/validators';

export default function CheckInForm() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [checking, setChecking] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [existingOwner, setExistingOwner] = useState(null); // mila to yahan aayega

  const [newDetails, setNewDetails] = useState({ name: '', phoneNumber: '', vehicleType: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckVehicle() {
    const err = validateVehicleNumber(vehicleNumber);
    setVehicleNumberError(err);
    if (err) return;

    setChecking(true);
    setSubmitError('');
    try {
      const res = await axiosClient.get(`/vehicle-owners/${vehicleNumber.toUpperCase()}`);
      setExistingOwner(res.data); // registered mila
    } catch (err) {
      if (err.response?.status === 404) {
        setExistingOwner(null); // registered nahi mila — naya form dikhega
      } else {
        setSubmitError('Something went wrong while checking vehicle.');
      }
    } finally {
      setLookupDone(true);
      setChecking(false);
    }
  }

  function handleNewDetailChange(e) {
    const { name, value } = e.target;
    setNewDetails((prev) => ({ ...prev, [name]: value }));
  }

  function handleNewDetailBlur(e) {
    const { name, value } = e.target;
    let error = '';
    if (name === 'name') error = validateName(value);
    if (name === 'phoneNumber') error = validatePhone(value);
    if (name === 'vehicleType') error = validateVehicleType(value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  async function handleConfirmCheckIn() {
    setSubmitError('');
    setLoading(true);
    try {
      const payload = existingOwner
        ? {
            name: existingOwner.name,
            phoneNumber: existingOwner.phoneNumber,
            vehicleNumber: vehicleNumber.toUpperCase(),
            vehicleType: existingOwner.vehicleType,
          }
        : {
            name: newDetails.name.trim(),
            phoneNumber: newDetails.phoneNumber.trim(),
            vehicleNumber: vehicleNumber.toUpperCase(),
            vehicleType: newDetails.vehicleType,
          };

      if (!existingOwner) {
        const newErrors = {
          name: validateName(newDetails.name),
          phoneNumber: validatePhone(newDetails.phoneNumber),
          vehicleType: validateVehicleType(newDetails.vehicleType),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((e) => e !== '')) {
          setLoading(false);
          return;
        }
      }

      const res = await axiosClient.post('/sessions/check-in', payload);
      setSuccess(`Checked in! Slot: ${res.data.slot.slotNumber}`);

      // reset everything for next vehicle
      setVehicleNumber('');
      setLookupDone(false);
      setExistingOwner(null);
      setNewDetails({ name: '', phoneNumber: '', vehicleType: '' });
      setErrors({});
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setVehicleNumber('');
    setLookupDone(false);
    setExistingOwner(null);
    setNewDetails({ name: '', phoneNumber: '', vehicleType: '' });
    setErrors({});
    setSubmitError('');
  }

  return (
    <div>
      {success && <div className="success-banner">{success}</div>}
      {submitError && <div className="error-text" style={{ marginBottom: 16 }}>{submitError}</div>}

      {/* Step 1: Vehicle number */}
      <div className="form-group">
        <label className="form-label">Vehicle Number</label>
        <input
          type="text"
          className={`form-input ${vehicleNumberError ? 'input-error' : ''}`}
          value={vehicleNumber}
          onChange={(e) => { setVehicleNumber(e.target.value); setLookupDone(false); }}
          placeholder="e.g. DL1AB1234"
          disabled={lookupDone}
        />
        {vehicleNumberError && <div className="error-text">{vehicleNumberError}</div>}
      </div>

      {!lookupDone && (
        <button className="btn-primary" onClick={handleCheckVehicle} disabled={checking}>
          {checking ? 'Checking...' : 'Check Vehicle'}
        </button>
      )}

      {/* Step 2a: Already registered */}
      {lookupDone && existingOwner && (
        <>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={existingOwner.name} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <input className="form-input" value={existingOwner.vehicleType} disabled />
          </div>
          <button className="btn-primary" onClick={handleConfirmCheckIn} disabled={loading}>
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </>
      )}

      {/* Step 2b: New vehicle — poora form */}
      {lookupDone && !existingOwner && (
        <>
          <p className="page-subtitle" style={{ marginTop: 8 }}>New vehicle — please fill in details</p>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              value={newDetails.name}
              onChange={handleNewDetailChange}
              onBlur={handleNewDetailBlur}
              placeholder="e.g. Rahul Sharma"
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              className={`form-input ${errors.phoneNumber ? 'input-error' : ''}`}
              value={newDetails.phoneNumber}
              onChange={handleNewDetailChange}
              onBlur={handleNewDetailBlur}
              placeholder="e.g. 9876543210"
            />
            {errors.phoneNumber && <div className="error-text">{errors.phoneNumber}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select
              name="vehicleType"
              className={`form-input ${errors.vehicleType ? 'input-error' : ''}`}
              value={newDetails.vehicleType}
              onChange={handleNewDetailChange}
              onBlur={handleNewDetailBlur}
            >
              <option value="">Select type</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="ev">EV</option>
              <option value="disabled">Accessible / Disabled</option>
            </select>
            {errors.vehicleType && <div className="error-text">{errors.vehicleType}</div>}
          </div>

          <button className="btn-primary" onClick={handleConfirmCheckIn} disabled={loading}>
            {loading ? 'Registering & checking in...' : 'Register & Check In'}
          </button>
        </>
      )}

      {lookupDone && (
        <div className="link-row">
          <a onClick={handleReset} style={{ cursor: 'pointer' }}>← Check a different vehicle</a>
        </div>
      )}
    </div>
  );
}