const STATE_STYLES = {
  FREE: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
  OCCUPIED: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  RESERVED: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
};

function getState(slot) {
  if (slot.occupancy === 'OCCUPIED') return 'OCCUPIED';
  if (slot.reservation?.status === 'RESERVED') return 'RESERVED';
  return 'FREE';
}

export default function SlotGrid({ slots }) {
  const byZone = slots.reduce((acc, slot) => {
    (acc[slot.zone] ||= []).push(slot);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
        {Object.entries(STATE_STYLES).map(([state, s]) => (
          <span key={state}>
            <span style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: 3,
              background: s.bg, border: `1.5px solid ${s.border}`, marginRight: 6,
            }} />
            {state.charAt(0) + state.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {Object.keys(byZone).sort().map((zone) => (
        <div key={zone} style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Zone {zone}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {byZone[zone]
              .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true }))
              .map((slot) => {
                const state = getState(slot);
                const s = STATE_STYLES[state];
                return (
                  <div
                    key={slot._id}
                    title={`${slot.slotNumber} · ${slot.type} · ${state}`}
                    style={{
                      width: 72, padding: '10px 0', textAlign: 'center',
                      background: s.bg, border: `1.5px solid ${s.border}`,
                      color: s.text, borderRadius: 8, transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{slot.slotNumber}</div>
                    <div style={{ fontSize: 11 }}>{slot.type}</div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}