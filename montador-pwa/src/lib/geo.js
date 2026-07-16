// Captura a posição atual do montador. Usado em check-in/checkout e ponto —
// o comprovante jurídico (assinatura, jornada) depende de lat/lng no momento do evento.
export function getPosition(timeout = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 }
    );
  });
}
