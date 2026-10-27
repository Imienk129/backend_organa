const crypto = require('crypto');

// RFC 6238 TOTP Generator & Validator (Window 30 seconds)
class SecurityEngine {
  // Generate 6-digit TOTP code based on secret and step
  generateTOTP(secret, timeStepSeconds = 30) {
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStepSeconds);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code = (
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  }

  // Validate TOTP with +/- 1 window tolerance to avoid clock drift issues
  validateTOTP(candidateCode, secret, timeStepSeconds = 30) {
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / timeStepSeconds);

    for (let delta = -1; delta <= 1; delta++) {
      const counter = currentCounter + delta;
      const buffer = Buffer.alloc(8);
      buffer.writeBigInt64BE(BigInt(counter));

      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(buffer);
      const digest = hmac.digest();

      const offset = digest[digest.length - 1] & 0xf;
      const code = (
        ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff)
      ) % 1000000;

      if (code.toString().padStart(6, '0') === candidateCode.toString().trim()) {
        return true;
      }
    }
    return false;
  }

  // Haversine Great-Circle Distance (in meters)
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

module.exports = new SecurityEngine();
