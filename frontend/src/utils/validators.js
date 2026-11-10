
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, 6-9 se start
const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/; // e.g. DL1AB1234

export function validateName(name) {
  if (!name.trim()) return 'Name is required';
  if (!NAME_REGEX.test(name.trim())) return 'Name should only contain letters and spaces';
  return '';
}

export function validatePhone(phone) {
  if (!phone.trim()) return 'Phone number is required';
  if (!PHONE_REGEX.test(phone.trim())) return 'Enter a valid 10-digit mobile number';
  return '';
}

export function validateVehicleNumber(vehicleNumber) {
  const cleaned = vehicleNumber.trim().toUpperCase().replace(/\s/g, '');
  if (!cleaned) return 'Vehicle number is required';
  if (!VEHICLE_NUMBER_REGEX.test(cleaned)) return 'Enter a valid vehicle number (e.g. DL1AB1234)';
  return '';
}

export function validateVehicleType(vehicleType) {
  if (!vehicleType) return 'Please select a vehicle type';
  return '';
}